Table users {
id integer [primary key]
phone varchar
email varchar
full_name varchar
avatar_url text
is_verified bool
is_driver_approved bool
active_mode varchar
no_show_count integer
created_at timestamp
updated_at timestamp
}

Table driver_profiles {
id integer [primary key]
user_id integer [ref: - users.id, not null]
license_number varchar
license_expiry date [not null]
rating number
total_rides integer
cancellation_count integer
host_no_show_count integer
created_at timestamp
updated_at timestamp
}

Table vehicles {
id integer [primary key]
driver_id integer [ref: > driver_profiles.id]
make varchar
model varchar
year integer
color varchar
plate_number varchar(50)
total_seats integer
vehicle_type varchar
is_active bool
created_at timestamp
updated_at timestamp
}

Table rides {
id integer [primary key]
driver_id integer [ref: > driver_profiles.id]
vehicle_id integer [ref: > vehicles.id]
origin_address text
origin_location geo_location
destination_address text
destination_location geo_location
scheduled_at timestamp
seats_total integer
seats_available integer
price_per_seat number
status varchar
started_at timestamp
completed_at timestamp
cancelled_reason varchar
created_at timestamp
updated_at timestamp
}

Table bookings{
id integer [primary key]
ride_id integer [ref: > rides.id]
rider_id integer [ref: - users.id]
seats_booked integer
total_amount number
status varchar
expires_at timestamp
confirmed_at timestamp
paid_at timestamp
no_show_reported_at timestamp
payment_attempts integer [not null]
last_payment_attempt_at timestamp
created_at timestamp
updated_at timestamp
}

Table payments {
id integer [primary key]
booking_id integer [ref: > bookings.id]
amount number
currency varchar
provider varchar
provider_ref varchar
status varchar
attempt_number integer
failure_reason varchar
refunded_at timestamp
created_at timestamp
}

Table reviews {
id integer [primary key]
ride_id integer [ref: > rides.id]
reviewer_id integer [ref: > users.id]
reviewee_id integer [ref: > users.id]
rating integer
comment text
created_at timestamp
}

Table identity_verifications {
id integer [primary key]
user_id integer [ref: - users.id]
type varchar
status varchar
provider varchar
provider_ref varchar
submitted_at timestamp
verified_at timestamp
rejection_reason text
created_at timestamp
updated_at timestamp
}
