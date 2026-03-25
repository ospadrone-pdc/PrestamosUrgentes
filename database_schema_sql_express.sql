-- Database Schema for Prestamos Urgentes (SQL Server Express)

-- Create Database
-- IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PrestamosUrgentes')
-- CREATE DATABASE PrestamosUrgentes;
-- GO
-- USE PrestamosUrgentes;
-- GO

-- 1. Clients
CREATE TABLE Clients (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255),
    Phone NVARCHAR(50),
    Address NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- 2. Properties (Guarantees)
CREATE TABLE Properties (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER REFERENCES Clients(Id) ON DELETE CASCADE,
    Description NVARCHAR(MAX) NOT NULL,
    EstimatedValue DECIMAL(15, 2),
    Location NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'Available',
    CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- 3. Partners (Investors & Referrers)
CREATE TABLE Partners (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- 'Investor', 'Referrer'
    Phone NVARCHAR(50),
    Email NVARCHAR(255),
    CommissionRate DECIMAL(5, 2) DEFAULT 0,
    Balance DECIMAL(15, 2) DEFAULT 0,
    CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- 4. Loans
CREATE TABLE Loans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ClientId UNIQUEIDENTIFIER REFERENCES Clients(Id),
    Amount DECIMAL(15, 2) NOT NULL,
    InterestRate DECIMAL(5, 2) NOT NULL,
    MoratorioRate DECIMAL(5, 2) NOT NULL,
    TermMonths INT NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Active',
    Light NVARCHAR(20) DEFAULT 'Green',
    StartDate DATE DEFAULT GETDATE(),
    NextPaymentDate DATE,
    PropertyId UNIQUEIDENTIFIER REFERENCES Properties(Id),
    CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- 6. Legal Cases
CREATE TABLE LegalCases (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LoanId UNIQUEIDENTIFIER REFERENCES Loans(Id) ON DELETE CASCADE,
    Expediente NVARCHAR(100),
    Juzgado NVARCHAR(255),
    Status NVARCHAR(100), -- 'Demanda Presentada', 'En Convenio', etc.
    LitigantAmount DECIMAL(15, 2),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- 7. Payments
CREATE TABLE Payments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LoanId UNIQUEIDENTIFIER REFERENCES Loans(Id) ON DELETE CASCADE,
    Amount DECIMAL(15, 2) NOT NULL,
    PaymentDate DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    Type NVARCHAR(50) NOT NULL,
    AppliedCapital DECIMAL(15, 2) DEFAULT 0,
    AppliedInterest DECIMAL(15, 2) DEFAULT 0,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
