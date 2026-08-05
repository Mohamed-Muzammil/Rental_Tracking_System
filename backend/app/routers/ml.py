from fastapi import APIRouter

from ..schemas.ml import ForecastResponse, MlModelMeta, TrainResponse
from ..services import ml_service

router = APIRouter(prefix="/ml", tags=["ml"])


@router.post("/train", response_model=TrainResponse)
def train():
    export = ml_service.train()
    return ml_service.train_response(export)


@router.get("/forecast", response_model=ForecastResponse)
def forecast():
    return ml_service.get_forecast()


@router.get("/model", response_model=MlModelMeta)
def model_meta():
    return ml_service.get_forecast()
