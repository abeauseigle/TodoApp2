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
-- Database: `dbName_MyTodo`
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

-- --------------------------------------------------------

--
-- Table structure for table `Todo`
--

CREATE TABLE IF NOT EXISTS `Todo` (
  `TodoID` int(11) NOT NULL AUTO_INCREMENT,
  `id` text,
  `TodoDesc` text,
  `TodoFollowup` text,
  `TodoPrio` int(11) NOT NULL,
  `TodoProgress` int(6) NOT NULL DEFAULT '0',
  `CategoryID` int(11) DEFAULT NULL,
  `TodoResp1ID` int(11) NOT NULL,
  `TodoResp2ID` int(11) NOT NULL,
  `TodoDateInserted` date DEFAULT NULL,
  `TodoDateDue` date DEFAULT NULL,
  `TodoDateDone` date DEFAULT NULL,
  `TodoActive` tinyint(1) DEFAULT '1',
  `TodoLastModifUserID` int(11) NOT NULL,
  `TodoLastModifDateH` datetime NOT NULL,
  `BDBid` char(13) NOT NULL,
  `last_sync_date` datetime NOT NULL,
  `msgToApp` char(10) NOT NULL,
  PRIMARY KEY (`TodoID`),
  KEY `AFaireID` (`TodoID`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=58 ;

--
-- Dumping data for table `Todo`
--

INSERT INTO `Todo` (`TodoID`, `id`, `TodoDesc`, `TodoFollowup`, `TodoPrio`, `TodoProgress`, `CategoryID`, `TodoResp1ID`, `TodoResp2ID`, `TodoDateInserted`, `TodoDateDue`, `TodoDateDone`, `TodoActive`, `TodoLastModifUserID`, `TodoLastModifDateH`, `BDBid`, `last_sync_date`, `msgToApp`) VALUES
(36, NULL, 'Description', 'FollowMe', 3, 0, 4, 2, 36, '2014-11-06', NULL, '2014-11-07', 0, 7, '2014-11-07 15:19:16', '', '0000-00-00 00:00:00', ''),
(7, NULL, 'Description', 'FollowMe', 3, 0, 4, 2, 0, '2014-09-14', '2014-09-15', '2014-09-15', 0, 7, '2014-10-09 02:06:42', '', '0000-00-00 00:00:00', ''),
(8, NULL, 'Description', 'FollowMe', 3, 0, 2, 2, 0, '2014-09-10', '2014-09-15', '2014-09-25', 0, 7, '2014-10-09 02:06:28', '', '0000-00-00 00:00:00', ''),
(9, NULL, 'Description', 'FollowMe', 2, 0, 4, 2, 85, '2014-08-01', '2014-09-26', '2014-11-17', 0, 50, '2015-01-06 12:23:46', '', '0000-00-00 00:00:00', ''),
(10, NULL, 'Description', 'FollowMe', 3, 0, 2, 2, 84, '2014-09-15', '2014-09-16', NULL, 0, 7, '2015-02-17 11:15:33', '', '0000-00-00 00:00:00', ''),
(11, NULL, 'Description', 'FollowMe', 1, 0, 5, 2, 84, '2014-09-15', '2014-09-23', NULL, 0, 7, '2016-02-03 09:19:11', '', '0000-00-00 00:00:00', ''),
(12, NULL, 'Description', 'FollowMe', 3, 0, 1, 85, 2, '2014-11-06', '2014-11-21', NULL, 0, 7, '2015-08-19 10:06:52', '', '0000-00-00 00:00:00', ''),
(13, NULL, 'Description', 'FollowMe', 1, 0, 4, 2, 0, '2014-09-15', '2014-09-30', '2014-09-15', 0, 7, '2014-10-09 02:06:59', '', '0000-00-00 00:00:00', ''),
(14, NULL, 'Description', 'FollowMe', 3, 0, 1, 2, 0, '2014-09-15', '2014-09-22', '2014-10-22', 0, 7, '2015-09-22 15:09:31', '', '0000-00-00 00:00:00', ''),
(15, NULL, 'Description', 'FollowMe', 2, 0, 1, 2, 5, '2014-09-16', '2014-09-19', NULL, 1, 8, '2014-10-09 01:55:37', '', '0000-00-00 00:00:00', ''),
(16, NULL, 'Description', 'FollowMe', 2, 0, 1, 2, 0, '2014-09-16', '2014-09-19', '2014-10-08', 0, 7, '2014-10-09 02:04:32', '', '0000-00-00 00:00:00', ''),
(17, NULL, 'Description', 'FollowMe', 1, 0, 5, 2, 5, '2014-09-16', '2014-09-17', NULL, 0, 7, '2015-02-17 11:24:24', '', '0000-00-00 00:00:00', ''),
(18, NULL, 'Description', 'FollowMe', 3, 0, 1, 2, 0, '2014-09-17', '2014-09-30', NULL, 0, 7, '2015-09-22 15:10:09', '', '0000-00-00 00:00:00', ''),
(19, NULL, 'Description', 'FollowMe', 2, 0, 1, 2, 0, '2014-09-17', '2015-09-30', '2015-09-22', 0, 7, '2015-09-22 15:11:56', '', '0000-00-00 00:00:00', ''),
(20, NULL, 'Description', 'FollowMe', 1, 0, 4, 2, 0, '2014-09-17', NULL, '2014-09-18', 0, 7, '2014-10-09 02:01:39', '', '0000-00-00 00:00:00', ''),
(21, NULL, 'Description', 'FollowMe', 3, 0, 2, 84, 2, '2014-09-17', '2014-09-19', NULL, 1, 7, '2014-10-09 02:01:19', '', '0000-00-00 00:00:00', ''),
(22, NULL, 'Description', 'FollowMe', 3, 0, 4, 2, 0, '2014-09-17', '2014-09-21', '2014-09-18', 0, 7, '2014-10-09 02:00:53', '', '0000-00-00 00:00:00', ''),
(23, NULL, 'Description', 'FollowMe', 3, 0, 0, 84, 0, '2014-09-17', '2014-09-19', NULL, 1, 7, '2014-09-25 17:19:59', '', '0000-00-00 00:00:00', ''),
(24, NULL, 'Description', 'FollowMe', 2, 0, 1, 2, 0, '2014-09-19', '2014-12-12', NULL, 0, 7, '2015-02-17 11:31:51', '', '0000-00-00 00:00:00', ''),
(25, NULL, 'Description', 'FollowMe', 2, 0, 4, 36, 2, '2014-09-19', '2014-09-26', '2014-10-09', 0, 7, '2014-10-09 02:39:07', '', '0000-00-00 00:00:00', ''),
(37, NULL, 'Description', 'FollowMe', 3, 0, 2, 2, 84, '2014-11-07', '2014-11-21', '2014-11-11', 0, 7, '2015-02-17 11:34:57', '', '0000-00-00 00:00:00', ''),
(38, NULL, 'Description', 'FollowMe', 3, 100, 5, 2, 2, '2015-08-19', '2015-08-31', NULL, 0, 7, '2016-02-03 09:21:09', '', '0000-00-00 00:00:00', ''),
(39, NULL, 'Description', 'FollowMe', 2, 0, 4, 5, 2, '2014-11-18', '2014-12-25', '2015-01-13', 0, 7, '2015-11-06 15:26:52', '', '0000-00-00 00:00:00', ''),
(40, NULL, 'Description', 'FollowMe', 2, 0, 3, 2, 0, '2014-11-27', NULL, NULL, 0, 7, '2015-02-17 11:40:17', '', '0000-00-00 00:00:00', ''),
(41, NULL, 'Description', 'FollowMe', 1, 0, 4, 2, 0, '2014-11-28', '2014-12-17', NULL, 1, 7, '2014-11-28 00:00:00', '', '0000-00-00 00:00:00', ''),
(42, NULL, 'Description', 'FollowMe', 2, 0, 4, 2, 0, '2014-11-28', '2014-12-17', '2014-12-05', 0, 7, '2014-12-05 19:00:55', '', '0000-00-00 00:00:00', ''),
(43, NULL, 'Description', 'FollowMe', 2, 0, 4, 2, 5, '2014-12-10', '2014-12-31', '2015-09-01', 0, 7, '2015-09-04 10:47:48', '', '0000-00-00 00:00:00', ''),
(44, NULL, 'Description', 'FollowMe', 2, 95, 4, 2, 0, '2014-12-01', '2015-01-31', '2015-01-13', 1, 7, '2015-11-06 18:26:25', '', '0000-00-00 00:00:00', ''),
(45, NULL, 'Description', 'FollowMe', 1, 90, 4, 2, 0, '2015-09-04', '2015-09-30', NULL, 1, 7, '2015-11-06 18:26:14', '', '0000-00-00 00:00:00', ''),
(46, NULL, 'Description', 'FollowMe', 2, 100, 4, 5, 2, '2015-09-04', '2015-10-31', NULL, 0, 7, '2016-02-03 09:21:38', '', '0000-00-00 00:00:00', ''),
(47, NULL, 'Description', 'FollowMe', 2, 100, 4, 2, 36, '2015-08-20', '2015-10-31', NULL, 1, 7, '2016-02-03 09:27:52', '', '0000-00-00 00:00:00', ''),
(48, NULL, 'Description', 'FollowMe', 2, 0, 4, 2, 0, '2015-09-21', '2015-09-30', NULL, 1, 7, '2015-09-21 00:00:00', '', '0000-00-00 00:00:00', ''),
(49, NULL, 'Description', 'FollowMe', 2, 0, 4, 2, 0, '2015-09-21', '2015-10-15', NULL, 1, 7, '2015-09-21 00:00:00', '', '0000-00-00 00:00:00', ''),
(50, NULL, 'Description', 'FollowMe', 2, 0, 4, 2, 0, '2015-09-21', NULL, NULL, 1, 7, '2015-09-21 00:00:00', '', '0000-00-00 00:00:00', ''),
(51, NULL, 'Description', 'FollowMe', 3, 99, 4, 2, 0, '2015-10-08', '2015-11-19', '2015-11-11', 0, 7, '2015-11-11 19:06:11', '', '0000-00-00 00:00:00', ''),
(52, NULL, 'Description', 'FollowMe', 2, 100, 4, 2, 0, '2015-09-01', '2015-11-06', '2015-11-11', 0, 7, '2015-11-11 19:04:07', '', '0000-00-00 00:00:00', ''),
(53, '4', 'Descriptionnnne', 'FollowMe', 1, 100, 4, 2, 2, '2015-11-02', '2015-12-31', NULL, 0, 1, '2016-03-15 12:03:50', '', '2016-03-15 12:03:50', ''),
(54, '2', 'Describe me', 'FollowMe', 2, 0, 4, 36, 36, '2016-02-03', '2016-02-29', NULL, 1, 1, '2016-03-15 09:18:30', '', '2016-03-15 09:18:30', ''),
(57, '40', 'BCO2', '', 2, 0, 5, 5, 5, '2016-03-15', '2016-03-15', '0000-00-00', 1, 1, '2016-03-15 09:22:34', '1458047867298', '2016-03-15 09:22:34', ''),
(56, '32', 'Description', 'FollowMe', 9, 0, 1, 85, 85, '2016-03-15', '0000-00-00', '0000-00-00', 1, 1, '2016-03-15 09:05:45', '1458047074759', '2016-03-15 09:05:45', '');

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE IF NOT EXISTS `User` (
  `UserID` int(11) NOT NULL AUTO_INCREMENT,
  `UserName` varchar(100) NOT NULL DEFAULT '',
  `UserPassword` varchar(100) DEFAULT NULL,
  `UserActive` tinyint(1) DEFAULT '1',
  `UserLastModifUserID` int(11) DEFAULT NULL,
  `UserLastModifDateH` datetime DEFAULT NULL,
  `ResourceID` int(11) DEFAULT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UsagerNom` (`UserName`),
  KEY `RessourceID` (`ResourceID`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=52 ;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`UserID`, `UserName`, `UserPassword`, `UserActive`, `UserLastModifUserID`, `UserLastModifDateH`, `ResourceID`) VALUES
(1, 'abeauseigle', '*94E6EB6040C83F781B734D686114AED930A55CFC', 1, 1, '2014-10-09 08:59:21', 2);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
