-- phpMyAdmin SQL Dump
-- version 4.0.10.7
-- http://www.phpmyadmin.net
--
-- Host: localhost:3306
-- Generation Time: Apr 10, 2016 at 07:23 PM
-- Server version: 5.5.44-MariaDB-cll-lve
-- PHP Version: 5.4.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `dbName_MyTodoDB`
--

-- --------------------------------------------------------

--
-- Table structure for table `Category`
--

CREATE TABLE IF NOT EXISTS `Category` (
  `CategoryID` int(11) NOT NULL,
  `CategoryName` varchar(15) NOT NULL,
  `CategoryLastModifDateH` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `CategoryActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `Category`
--

INSERT INTO `Category` (`CategoryID`, `CategoryName`, `CategoryLastModifDateH`, `CategoryActive`) VALUES
(1, 'Sales', '2015-01-01 00:00:00', 1),
(2, 'Management', '2015-01-01 00:00:00', 1),
(3, 'Product', '2015-01-01 00:00:00', 1),
(4, 'Programming', '2015-01-01 00:00:00', 1),
(5, 'Other', '2015-01-01 00:00:00', 1);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
