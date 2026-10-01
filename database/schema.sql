-- OnlineShoppingDB : MySQL 8 script (DDL + sample data + view)
CREATE DATABASE IF NOT EXISTS OnlineShoppingDB;
USE OnlineShoppingDB;

CREATE TABLE CATEGORY (
  Category_ID INT PRIMARY KEY,
  Category_Name VARCHAR(50) NOT NULL UNIQUE,
  Description VARCHAR(150)
);
CREATE TABLE CUSTOMER (
  Customer_ID INT PRIMARY KEY,
  Name VARCHAR(60) NOT NULL,
  Email VARCHAR(80) NOT NULL UNIQUE,
  Phone CHAR(10) NOT NULL CHECK (Phone REGEXP '^[0-9]{10}$'),
  Address VARCHAR(150) NOT NULL
);
CREATE TABLE PRODUCT (
  Product_ID INT PRIMARY KEY,
  Name VARCHAR(80) NOT NULL,
  Price DECIMAL(10,2) NOT NULL CHECK (Price > 0),
  Stock INT NOT NULL CHECK (Stock >= 0),
  Category_ID INT NOT NULL,
  FOREIGN KEY (Category_ID) REFERENCES CATEGORY(Category_ID)
);
CREATE TABLE CART (
  Cart_ID INT PRIMARY KEY,
  Customer_ID INT NOT NULL,
  Created_Date DATE NOT NULL,
  FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID)
);
CREATE TABLE ORDERS (
  Order_ID INT PRIMARY KEY,
  Customer_ID INT NOT NULL,
  Order_Date DATE NOT NULL,
  Total_Amount DECIMAL(10,2) NOT NULL CHECK (Total_Amount > 0),
  Status VARCHAR(15) NOT NULL CHECK (Status IN ('PLACED','SHIPPED','DELIVERED','CANCELLED')),
  FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID)
);
CREATE TABLE ORDER_ITEM (
  Order_Item_ID INT PRIMARY KEY,
  Order_ID INT NOT NULL,
  Product_ID INT NOT NULL,
  Quantity INT NOT NULL CHECK (Quantity > 0),
  Unit_Price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID),
  FOREIGN KEY (Product_ID) REFERENCES PRODUCT(Product_ID)
);
CREATE TABLE PAYMENT (
  Payment_ID INT PRIMARY KEY,
  Order_ID INT NOT NULL,
  Amount DECIMAL(10,2) NOT NULL CHECK (Amount > 0),
  Method VARCHAR(10) NOT NULL CHECK (Method IN ('UPI','Card','COD')),
  Status VARCHAR(10) NOT NULL CHECK (Status IN ('Pending','Paid','Failed')),
  FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID)
);
CREATE TABLE DELIVERY (
  Delivery_ID INT PRIMARY KEY,
  Order_ID INT NOT NULL,
  Address VARCHAR(150) NOT NULL,
  Tracking_No VARCHAR(20) NOT NULL UNIQUE,
  Status VARCHAR(12) NOT NULL CHECK (Status IN ('Processing','Shipped','Delivered')),
  FOREIGN KEY (Order_ID) REFERENCES ORDERS(Order_ID)
);

INSERT INTO CATEGORY VALUES (1,'Electronics','Devices and accessories'),(2,'Fashion','Clothing and footwear'),(3,'Home & Kitchen','Appliances and decor'),(4,'Books','Textbooks and novels');
INSERT INTO CUSTOMER VALUES (101,'Sai','sai@example.com','9876543210','AP, India'),(102,'Ananya','ananya@example.com','9123456780','Hyderabad, India'),(103,'Ravi','ravi@example.com','9988776655','Chennai, India');
INSERT INTO PRODUCT VALUES (201,'Wireless Headphones',1499,25,1),(202,'Smart Watch',2999,15,1),(203,'Running Shoes',2499,30,2),(204,'Denim Jacket',1899,20,2),(205,'Air Fryer',4999,10,3),(206,'Table Lamp',799,40,3),(207,'DBMS Concepts Book',599,50,4),(208,'Bluetooth Speaker',1999,18,1);
INSERT INTO ORDERS VALUES (301,101,'2026-10-05',1499,'PLACED'),(302,102,'2026-10-03',3098,'DELIVERED'),(303,103,'2026-10-04',2999,'SHIPPED');
INSERT INTO ORDER_ITEM VALUES (1,301,201,1,1499),(2,302,203,1,2499),(3,302,207,1,599),(4,303,202,1,2999);
INSERT INTO PAYMENT VALUES (401,301,1499,'UPI','Pending'),(402,302,3098,'Card','Paid'),(403,303,2999,'COD','Pending');
INSERT INTO DELIVERY VALUES (501,301,'AP, India','TRK301','Processing'),(502,302,'Hyderabad, India','TRK302','Delivered'),(503,303,'Chennai, India','TRK303','Shipped');

CREATE VIEW OrderSummary AS
SELECT o.Order_ID, c.Name AS Customer_Name, o.Order_Date, o.Total_Amount, o.Status
FROM ORDERS o JOIN CUSTOMER c ON o.Customer_ID = c.Customer_ID;

SELECT * FROM OrderSummary ORDER BY Order_Date DESC;
