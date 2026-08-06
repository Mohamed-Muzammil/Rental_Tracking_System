import random
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_clients_repo
from ..repositories.base import Repo
from ..schemas.clients import ClientOut, IssueFineRequest

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=List[ClientOut])
def list_clients(repo: Repo = Depends(get_clients_repo)):
    return repo.list()


@router.post("/{client_id}/fine", response_model=ClientOut)
def issue_fine(
    client_id: str,
    body: IssueFineRequest,
    repo: Repo = Depends(get_clients_repo),
):
    client = repo.get(client_id)
    if not client:
        raise HTTPException(404, f"Unknown client {client_id}")

    # Generate fine invoice
    today_str = date(2026, 8, 5).strftime("%Y-%m-%d") # Hardcoded SIM_TODAY
    suffix = random.randint(1000, 9999)
    inv_id = f"FINE-{body.equipment_id}-{suffix}"
    
    new_inv = {
        "id": inv_id,
        "date": today_str,
        "amount": body.amount,
        "status": "overdue"
    }
    
    billing_history = client.get("billingHistory", [])
    billing_history.insert(0, new_inv)
    
    fine_amount = client.get("fineAmount", 0) + body.amount
    
    # Update client
    updates = {
        "billingHistory": billing_history,
        "fineAmount": fine_amount
    }
    repo.update(client_id, updates)
    
    return repo.get(client_id)


@router.put("/{client_id}/invoice/{invoice_id}/pay", response_model=ClientOut)
def pay_invoice(
    client_id: str,
    invoice_id: str,
    repo: Repo = Depends(get_clients_repo),
):
    client = repo.get(client_id)
    if not client:
        raise HTTPException(404, f"Unknown client {client_id}")

    billing_history = client.get("billingHistory", [])
    invoice = next((inv for inv in billing_history if inv["id"] == invoice_id), None)
    
    if not invoice:
        raise HTTPException(404, f"Unknown invoice {invoice_id}")
        
    if invoice["status"] == "paid":
        return client # Already paid
        
    invoice["status"] = "paid"
    
    # Update fineAmount / paidFines if it's a fine
    updates = {"billingHistory": billing_history}
    
    if invoice_id.startswith("FINE-"):
        fine_amount = max(0, client.get("fineAmount", 0) - invoice["amount"])
        paid_fines = client.get("paidFines", 0) + invoice["amount"]
        updates["fineAmount"] = fine_amount
        updates["paidFines"] = paid_fines
    else:
        # Standard overdue invoice
        overdue_amount = max(0, client.get("overdueAmount", 0) - invoice["amount"])
        updates["overdueAmount"] = overdue_amount
        
    repo.update(client_id, updates)
    
    return repo.get(client_id)
