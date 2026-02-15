from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from auth import CurrentUser
import models
from database import DB
from schemas import CarCreate, CarResponse, CarResponseWithBookings, CarUpdate

router = APIRouter()


import shutil
import os
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form

@router.post("", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
async def create_car(
    brand: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    price_per_day: float = Form(...),
    location: str = Form(...),
    contact_number: str = Form(...),
    image: UploadFile = File(...),
    current_user: CurrentUser = None, # Depends is injected in main, but here we use the type alias logic which works if auth.py is correct
    db: DB = None,
):
    # Ensure directory exists
    os.makedirs("media/car_images", exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(image.filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = f"media/car_images/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    new_car = models.Car(
        owner_id=current_user.id,
        brand=brand,
        model=model,
        year=year,
        price_per_day=price_per_day,
        location=location,
        contact_number=contact_number,
        image_file=unique_filename,
    )

    db.add(new_car)
    await db.commit()
    await db.refresh(new_car)
    return new_car


@router.get("", response_model=list[CarResponse])
async def list_cars(db: DB):
    result = await db.execute(select(models.Car))
    cars = result.scalars().all()
    return cars


@router.get("/my", response_model=list[CarResponse])
async def get_my_cars(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(models.Car).where(models.Car.owner_id == current_user.id)
    )
    cars = result.scalars().all()
    return cars


@router.get("/{car_id}", response_model=CarResponseWithBookings)
async def get_car(car_id: int, db: DB):
    result = await db.execute(
        select(models.Car)
        .options(selectinload(models.Car.bookings))
        .where(models.Car.id == car_id)
    )
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )
    return car


@router.put("/{car_id}", response_model=CarResponse)
async def update_car(car_id: int, car: CarUpdate, current_user: CurrentUser, db: DB):
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    existing_car = result.scalars().first()
    if not existing_car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )

    if existing_car.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update this car"
        )

    for field, value in car.model_dump(exclude_unset=True).items():
        setattr(existing_car, field, value)

    await db.commit()
    await db.refresh(existing_car)
    return existing_car


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_car(car_id: int, current_user: CurrentUser, db: DB):
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )

    if car.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete this car"
        )

    await db.delete(car)
    await db.commit()
