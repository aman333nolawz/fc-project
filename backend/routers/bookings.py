from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from auth import CurrentUser
import models
from database import DB
from schemas import BookingCreate, BookingResponse

router = APIRouter()


@router.get("/my", response_model=list[BookingResponse])
async def get_my_bookings(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(models.Booking)
        .options(selectinload(models.Booking.car))
        .where(models.Booking.user_id == current_user.id)
        .order_by(models.Booking.start_date.desc())
    )
    bookings = result.scalars().all()
    return bookings


@router.post("", response_model=BookingCreate, status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(models.Car)
        .options(selectinload(models.Car.owner))
        .where(models.Car.id == booking.car_id)
    )
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )
    # check if any existing bookings for the car overlap with the requested dates
    result = await db.execute(
        select(models.Booking)
        .where(models.Booking.car_id == booking.car_id)
        .where(
            (models.Booking.start_date <= booking.end_date)
            & (models.Booking.end_date >= booking.start_date)
        )
    )
    overlapping_booking = result.scalars().first()
    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Car is already booked for the selected dates",
        )

    new_booking = models.Booking(
        user_id=current_user.id,
        car_id=booking.car_id,
        start_date=booking.start_date,
        end_date=booking.end_date,
    )

    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)

    # Removed: car.status = "booked" - availablity is now determining by overlap check only
    await db.commit()

    return new_booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(booking_id: int, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(models.Booking)
        .options(selectinload(models.Booking.car))
        .options(selectinload(models.Booking.user))
        .where(models.Booking.id == booking_id)
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot cancel this booking",
        )

    # Removed: if booking.car: booking.car.status = "available"

    await db.delete(booking)
    await db.commit()


@router.post("/{booking_id}/complete", status_code=status.HTTP_200_OK)
async def complete_booking(booking_id: int, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(models.Booking)
        .options(selectinload(models.Booking.car))
        .options(selectinload(models.Booking.user))
        .where(models.Booking.id == booking_id)
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot complete this booking",
        )

    # Removed: if booking.car: booking.car.status = "available"

    await db.delete(booking)
    await db.commit()
