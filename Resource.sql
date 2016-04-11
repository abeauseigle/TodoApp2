-- phpMyAdmin SQL Dump
-- version 4.0.10.7
-- http://www.phpmyadmin.net
--
-- Host: localhost:3306
-- Generation Time: Apr 10, 2016 at 07:22 PM
-- Server version: 5.5.44-MariaDB-cll-lve
-- PHP Version: 5.4.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `affaire_MyTodo`
--

-- --------------------------------------------------------

--
-- Table structure for table `Resource`
--

CREATE TABLE IF NOT EXISTS `Resource` (
  `ResourceID` int(11) NOT NULL AUTO_INCREMENT,
  `ResourceIni` varchar(4) DEFAULT NULL,
  `ResourceName` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `ResourceActive` tinyint(1) DEFAULT NULL,
  `ResourceLastModifUsagerID` int(11) DEFAULT NULL,
  `ResourceLastModifDateH` datetime DEFAULT NULL,
  PRIMARY KEY (`ResourceID`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=86 ;

--
-- Dumping data for table `Resource`
--

INSERT INTO `Resource` (`ResourceID`, `ResourceIni`, `ResourceName`, `ResourceActive`, `ResourceLastModifUsagerID`, `ResourceLastModifDateH`) VALUES
(2, 'AB', 'Alain Beauseigle', 1, 32, '2008-11-18 16:22:29'),
(5, 'BB', 'Benoît Brière', 1, 31, '2008-12-11 18:19:31'),
(36, 'DD', 'Diane Dion', 1, 31, '2008-12-11 18:02:32'),
(84, 'CC', 'Carl Caron', 1, 31, '2008-12-11 18:13:50'),
(85, 'EE', 'Emilie Eve', 1, 31, '2016-02-02 12:12:12');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
