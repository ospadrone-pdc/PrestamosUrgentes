-- Database Schema for Prestamos Urgentes (PostgreSQL)
-- For Render/Supabase/Railway

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients
CREATE TABLE IF NOT EXISTS Clients (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    Phone VARCHAR(50),
    Address TEXT,
    Notes TEXT,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Properties (Guarantees)
CREATE TABLE IF NOT EXISTS Properties (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ClientId UUID REFERENCES Clients(Id) ON DELETE CASCADE,
    Description TEXT NOT NULL,
    EstimatedValue DECIMAL(15, 2),
    Location VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'Available',
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Partners (Investors & Referrers)
CREATE TABLE IF NOT EXISTS Partners (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255) NOT NULL,
    Type VARCHAR(50) NOT NULL, -- 'Investor', 'Referrer'
    Phone VARCHAR(50),
    Email VARCHAR(255),
    CommissionRate DECIMAL(5, 2) DEFAULT 0,
    Balance DECIMAL(15, 2) DEFAULT 0,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Loans
CREATE TABLE IF NOT EXISTS Loans (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ClientId UUID REFERENCES Clients(Id),
    Amount DECIMAL(15, 2) NOT NULL,
    InterestRate DECIMAL(5, 2) NOT NULL,
    MoratorioRate DECIMAL(5, 2) NOT NULL,
    TermMonths INT NOT NULL,
    Status VARCHAR(50) DEFAULT 'Active',
    Light VARCHAR(20) DEFAULT 'Green',
    StartDate DATE DEFAULT CURRENT_DATE,
    NextPaymentDate DATE,
    PropertyId UUID REFERENCES Properties(Id),
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Legal Cases
CREATE TABLE IF NOT EXISTS LegalCases (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    LoanId UUID REFERENCES Loans(Id) ON DELETE CASCADE,
    Expediente VARCHAR(100),
    Juzgado VARCHAR(255),
    Status VARCHAR(100), -- 'Demanda Presentada', 'En Convenio', etc.
    LitigantAmount DECIMAL(15, 2),
    Notes TEXT,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payments
CREATE TABLE IF NOT EXISTS Payments (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    LoanId UUID REFERENCES Loans(Id) ON DELETE CASCADE,
    Amount DECIMAL(15, 2) NOT NULL,
    PaymentDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    Type VARCHAR(50) NOT NULL,
    AppliedCapital DECIMAL(15, 2) DEFAULT 0,
    AppliedInterest DECIMAL(15, 2) DEFAULT 0,
    Notes TEXT,
    CreatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
