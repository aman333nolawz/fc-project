from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr


class UserBase(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=120)


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    image_file: str | None
    image_path: str


class UserPrivate(UserPublic):
    email: EmailStr


class UserUpdate(BaseModel):
    username: str | None = Field(min_length=1, max_length=50, default=None)
    email: EmailStr | None = Field(max_length=120, default=None)
    image_file: str | None = Field(default=None, min_length=1, max_length=200)


class Token(BaseModel):
    access_token: str
    token_type: str


class CarBase(BaseModel):
    brand: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    year: int = Field(ge=2000, le=datetime.now().year + 1)
    price_per_day: float = Field(gt=0)
    location: str = Field(min_length=1, max_length=100)
    contact_number: str = Field(min_length=1, max_length=20)
    image_file: str = Field(min_length=1, max_length=200)


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    brand: str | None = Field(min_length=1, max_length=50, default=None)
    model: str | None = Field(min_length=1, max_length=50, default=None)
    year: int | None = Field(ge=2000, le=datetime.now().year + 1, default=None)
    price_per_day: float | None = Field(gt=0, default=None)
    location: str | None = Field(min_length=1, max_length=100, default=None)
    contact_number: str | None = Field(min_length=1, max_length=20, default=None)
    image_file: str | None = Field(min_length=1, max_length=200, default=None)
    status: str | None = Field(min_length=1, max_length=20, default=None)


class CarResponse(CarBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    status: str
    image_path: str


class CarResponseWithBookings(CarResponse):
    bookings: list[BookingResponse]


class BookingBase(BaseModel):
    car_id: int
    start_date: datetime
    end_date: datetime


class BookingCreate(BookingBase):
    pass


class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    car: CarResponse
