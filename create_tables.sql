-- Ensure the database context is set
USE company_management;

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('normal', 'admin')) NOT NULL
);

-- Create the holiday_requests table
CREATE TABLE holiday_requests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create the private_messages table
CREATE TABLE private_messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sender_id INT,
    recipient_id INT,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);