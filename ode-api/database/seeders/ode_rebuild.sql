/*
SQLyog Community v13.3.1 (64 bit)
MySQL - 9.1.0 : Database - ode_rebuild
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`ode_rebuild` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `ode_rebuild`;

/*Table structure for table `agencies` */

DROP TABLE IF EXISTS `agencies`;

CREATE TABLE `agencies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `agency_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modules_setup` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `agencies` */

/*Table structure for table `blogs` */

DROP TABLE IF EXISTS `blogs`;

CREATE TABLE `blogs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywords` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `img_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blogs_slug_unique` (`slug`),
  KEY `blogs_status_index` (`status`),
  KEY `blogs_sort_order_index` (`sort_order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `blogs` */

/*Table structure for table `cache` */

DROP TABLE IF EXISTS `cache`;

CREATE TABLE `cache` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `cache` */

/*Table structure for table `cache_locks` */

DROP TABLE IF EXISTS `cache_locks`;

CREATE TABLE `cache_locks` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `cache_locks` */

/*Table structure for table `carrier_gl_limits` */

DROP TABLE IF EXISTS `carrier_gl_limits`;

CREATE TABLE `carrier_gl_limits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `carrier` enum('ASI','FDEAN','IH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_limit` int unsigned NOT NULL,
  `max_limit` int unsigned NOT NULL,
  `gl_limit` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gl_limit_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `carrier_gl_limits_carrier_min_limit_max_limit_index` (`carrier`,`min_limit`,`max_limit`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `carrier_gl_limits` */

insert  into `carrier_gl_limits`(`id`,`carrier`,`min_limit`,`max_limit`,`gl_limit`,`gl_limit_type`,`created_at`,`updated_at`) values 
(4,'ASI',0,100,'$500,000','Per Occurrence','2026-06-03 18:43:21','2026-06-03 18:43:21');

/*Table structure for table `commissions` */

DROP TABLE IF EXISTS `commissions`;

CREATE TABLE `commissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `lead_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('affiliate','agent','planner','customer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('accrued','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'accrued',
  `accrued_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL,
  `paid_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `commissions_lead_id_type_unique` (`lead_id`,`type`),
  KEY `commissions_user_id_status_index` (`user_id`,`status`),
  KEY `commissions_accrued_at_index` (`accrued_at`),
  KEY `commissions_status_index` (`status`)
) ENGINE=MyISAM AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `commissions` */

insert  into `commissions`(`id`,`user_id`,`lead_id`,`amount`,`type`,`status`,`accrued_at`,`paid_at`,`paid_method`,`paid_note`,`created_at`,`updated_at`) values 
(1,34,7,126.31,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(2,35,8,123.45,'customer','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(3,36,9,66.36,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(4,37,10,54.08,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(5,38,11,86.66,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(6,40,12,52.26,'affiliate','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(7,40,13,6.47,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(8,42,14,129.72,'agent','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(9,43,15,20.27,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(10,44,16,79.09,'affiliate','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(11,45,17,51.25,'affiliate','paid','2026-06-03 18:43:04','2026-06-03 18:43:04','Zelle','Test payment.','2026-06-03 18:43:04','2026-06-03 18:43:04'),
(12,46,18,64.95,'planner','paid','2026-06-03 18:43:04','2026-06-03 18:43:04','Zelle','Test payment.','2026-06-03 18:43:04','2026-06-03 18:43:04'),
(13,48,19,113.13,'agent','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(14,48,20,74.07,'affiliate','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(15,49,21,56.06,'affiliate','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(16,50,22,56.54,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(17,51,23,62.90,'planner','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(18,53,24,69.29,'agent','accrued','2025-01-15 00:00:00',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(19,54,25,136.60,'agent','accrued','2025-03-10 00:00:00',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(20,55,26,77.27,'affiliate','accrued','2025-06-01 00:00:00',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(21,58,27,10.00,'affiliate','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(22,59,28,15.00,'affiliate','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(23,60,29,20.00,'planner','paid','2026-06-03 18:43:04','2026-06-03 18:43:04','Zelle','Test payment.','2026-06-03 18:43:04','2026-06-03 18:43:04'),
(24,62,30,39.60,'planner','paid','2026-06-03 18:43:04','2026-06-03 18:43:04','Zelle','Paid via Zelle transfer.','2026-06-03 18:43:04','2026-06-03 18:43:04'),
(25,64,31,63.05,'customer','accrued','2026-06-03 18:43:04',NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04'),
(26,66,32,65.23,'agent','paid','2026-06-03 18:43:04','2026-06-03 18:43:04','Zelle','Test payment.','2026-06-03 18:43:04','2026-06-03 18:43:04'),
(27,69,33,76.43,'customer','paid','2026-06-03 18:43:05','2026-06-03 18:43:05','ACH',NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05'),
(28,70,34,97.35,'customer','paid','2026-06-03 18:43:05','2026-06-03 18:43:05','ACH',NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05'),
(29,71,35,16.59,'customer','paid','2026-06-03 18:43:05','2026-06-03 18:43:05','ACH',NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05'),
(30,73,36,96.40,'planner','paid','2026-06-03 18:43:05','2026-06-03 18:43:05','Wire',NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05'),
(31,74,37,119.16,'planner','paid','2026-06-03 18:43:05','2026-06-03 18:43:05','Zelle','Test payment.','2026-06-03 18:43:05','2026-06-03 18:43:05'),
(32,76,38,138.64,'customer','accrued','2026-06-03 18:43:05',NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05'),
(33,159,43,15.00,'agent','accrued','2026-06-03 18:43:08',NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(34,161,44,15.00,'agent','accrued','2026-06-03 18:43:08',NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(35,175,63,20.00,'agent','accrued','2026-06-03 18:43:09',NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(36,177,64,20.00,'agent','accrued','2026-06-03 18:43:09',NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(37,179,65,20.00,'agent','accrued','2026-06-03 18:43:09',NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(38,180,66,10.00,'affiliate','accrued','2026-06-03 18:43:09',NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(39,181,67,10.00,'affiliate','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(40,182,69,25.00,'affiliate','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(41,183,70,24.00,'affiliate','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(42,184,71,15.00,'agent','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(43,185,72,16.00,'agent','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(44,186,74,15.00,'planner','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(45,187,76,5.00,'customer','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(46,188,78,10.00,'affiliate','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(47,189,79,15.00,'planner','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(48,190,80,5.00,'customer','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(49,191,81,10.00,'affiliate','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(50,194,81,16.00,'agent','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(51,192,81,15.00,'planner','accrued','2026-06-03 18:43:10',NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(52,193,81,5.00,'customer','accrued','2026-06-03 18:43:11',NULL,NULL,NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(53,195,82,10.00,'affiliate','accrued','2026-06-03 18:43:11',NULL,NULL,NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(54,196,83,10.00,'affiliate','paid','2026-06-03 18:43:11','2026-06-03 18:43:11','Zelle','Q1 payout','2026-06-03 18:43:11','2026-06-03 18:43:11'),
(55,208,88,5.00,'customer','accrued','2026-06-03 18:43:12',NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12'),
(56,210,89,5.00,'customer','accrued','2026-06-03 18:43:12',NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12'),
(57,229,109,5.00,'customer','accrued','2026-06-03 18:43:13',NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(58,231,110,5.00,'customer','accrued','2026-06-03 18:43:13',NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(59,308,168,15.00,'planner','accrued','2026-06-03 18:43:19',NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(60,310,169,15.00,'planner','accrued','2026-06-03 18:43:19',NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(61,315,179,15.00,'planner','accrued','2026-06-03 18:43:19',NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(62,317,180,15.00,'planner','accrued','2026-06-03 18:43:19',NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(63,319,181,15.00,'planner','accrued','2026-06-03 18:43:19',NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(64,355,182,10.00,'affiliate','accrued','2026-06-03 18:43:22',NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(65,357,183,10.00,'affiliate','accrued','2026-06-03 18:43:22',NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(66,358,184,10.00,'affiliate','accrued','2026-06-03 18:43:22',NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(67,360,185,10.00,'affiliate','accrued','2026-06-03 18:43:22',NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22');

/*Table structure for table `contact_submissions` */

DROP TABLE IF EXISTS `contact_submissions`;

CREATE TABLE `contact_submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_submissions_is_read_index` (`is_read`),
  KEY `contact_submissions_created_at_index` (`created_at`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `contact_submissions` */

insert  into `contact_submissions`(`id`,`name`,`email`,`phone`,`subject`,`message`,`is_read`,`created_at`,`updated_at`) values 
(1,'Jane Doe','jane@example.com',NULL,NULL,'I have a question about wedding coverage.',0,'2026-06-03 18:43:11','2026-06-03 18:43:11');

/*Table structure for table `doc_sign_statuses` */

DROP TABLE IF EXISTS `doc_sign_statuses`;

CREATE TABLE `doc_sign_statuses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `envelope_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `sent_at` timestamp NULL DEFAULT NULL,
  `signed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doc_sign_statuses_envelope_id_unique` (`envelope_id`),
  KEY `doc_sign_statuses_lead_id_created_at_index` (`lead_id`,`created_at`),
  KEY `doc_sign_statuses_status_index` (`status`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `doc_sign_statuses` */

insert  into `doc_sign_statuses`(`id`,`lead_id`,`envelope_id`,`status`,`sent_at`,`signed_at`,`created_at`,`updated_at`) values 
(1,114,'env-abc-123','sent','2026-06-03 18:43:13',NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(2,115,'env-new-001','sent','2026-06-03 18:43:14',NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14'),
(3,116,'env-existing','sent','2026-06-03 16:43:14',NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14'),
(4,118,'env-webhook-1','delivered','2026-06-03 18:43:14',NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14'),
(5,119,'env-completed','completed','2026-06-03 18:43:14','2026-06-03 18:43:14','2026-06-03 18:43:14','2026-06-03 18:43:14');

/*Table structure for table `email_templates` */

DROP TABLE IF EXISTS `email_templates`;

CREATE TABLE `email_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_templates_key_unique` (`key`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `email_templates` */

insert  into `email_templates`(`id`,`key`,`subject`,`body`,`variables`,`is_active`,`created_at`,`updated_at`) values 
(1,'non_401','Ea eveniet eum praesentium.','<p>Hi {firstName},</p><p>Sint exercitationem in ad ut in. Corrupti ut et eaque dolorum recusandae. Qui dolorum eos porro consectetur sed autem.</p>','[{\"name\": \"firstName\", \"description\": \"Recipient first name\"}]',1,'2026-06-03 18:43:01','2026-06-03 18:43:01'),
(2,'quia_123','Ut nisi eos ab.','<p>Hi {firstName},</p><p>Animi quia quod rem qui magnam rem quo perspiciatis. Earum quisquam voluptate quos aut quisquam sint sequi. Quas quia aut aspernatur.</p>','[{\"name\": \"firstName\", \"description\": \"Recipient first name\"}]',1,'2026-06-03 18:43:01','2026-06-03 18:43:01'),
(3,'voluptas_848','Debitis eveniet pariatur esse recusandae.','<p>Hi {firstName},</p><p>Sint pariatur omnis aliquam debitis. Accusantium vel similique officia odio et est est. Ducimus dolore dolore ipsa sunt.</p>','[{\"name\": \"firstName\", \"description\": \"Recipient first name\"}]',1,'2026-06-03 18:43:01','2026-06-03 18:43:01'),
(4,'post_event','Best wishes','<p>Hi {firstName},</p><p>Dolor ut non incidunt vero mollitia veritatis. Dolores laboriosam magnam voluptate iure eius et quia perspiciatis. Quis non commodi unde impedit ipsa.</p>','[{\"name\": \"firstName\", \"description\": \"Recipient first name\"}]',1,'2026-06-03 18:43:01','2026-06-03 18:43:01'),
(5,'est_391','New subject','<p>Hi {firstName},</p><p>Corrupti eos distinctio repudiandae commodi sed magni. Eaque temporibus fugiat sunt eos non quo praesentium. Sed soluta vel veritatis amet reprehenderit. Provident numquam vel numquam vel ut nisi sed.</p>','[{\"name\": \"firstName\", \"description\": \"Recipient first name\"}]',0,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(7,'necessitatibus_586','Hello {firstName}','<p>Hi {firstName}!</p>','[{\"name\": \"firstName\", \"description\": \"First name\"}]',1,'2026-06-03 18:43:02','2026-06-03 18:43:02');

/*Table structure for table `event_rate_states` */

DROP TABLE IF EXISTS `event_rate_states`;

CREATE TABLE `event_rate_states` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_rate_id` bigint unsigned NOT NULL,
  `state_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_rate_states_event_rate_id_state_code_unique` (`event_rate_id`,`state_code`),
  KEY `event_rate_states_state_code_index` (`state_code`)
) ENGINE=MyISAM AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `event_rate_states` */

insert  into `event_rate_states`(`id`,`event_rate_id`,`state_code`) values 
(31,29,'OR'),
(32,31,'CA'),
(33,32,'CA'),
(34,32,'NY');

/*Table structure for table `event_rates` */

DROP TABLE IF EXISTS `event_rates`;

CREATE TABLE `event_rates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_type_id` bigint unsigned NOT NULL,
  `carrier` enum('ASI','FDEAN','IH') COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_audience` int unsigned NOT NULL DEFAULT '1',
  `max_audience` int unsigned NOT NULL DEFAULT '9999',
  `rate` decimal(8,2) NOT NULL,
  `min_limit` int unsigned DEFAULT NULL,
  `max_limit` int unsigned DEFAULT NULL,
  `limit_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `host_liquor` tinyint(1) NOT NULL DEFAULT '0',
  `liquor` tinyint(1) NOT NULL DEFAULT '0',
  `noha` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N/A',
  `w_o_s` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N/A',
  `p_a_n_c_b` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N/A',
  `e_a_i` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N/A',
  `same_day_coverage` tinyint(1) NOT NULL DEFAULT '0',
  `weekend_coverage` tinyint(1) NOT NULL DEFAULT '0',
  `quote_instantly` tinyint(1) NOT NULL DEFAULT '1',
  `bind_instantly` tinyint(1) NOT NULL DEFAULT '1',
  `additional_people` int unsigned DEFAULT NULL,
  `additional_charges` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_rates_event_type_id_carrier_index` (`event_type_id`,`carrier`),
  KEY `event_rates_min_audience_max_audience_index` (`min_audience`,`max_audience`),
  KEY `event_rates_same_day_coverage_index` (`same_day_coverage`)
) ENGINE=MyISAM AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `event_rates` */

insert  into `event_rates`(`id`,`event_type_id`,`carrier`,`min_audience`,`max_audience`,`rate`,`min_limit`,`max_limit`,`limit_type`,`host_liquor`,`liquor`,`noha`,`w_o_s`,`p_a_n_c_b`,`e_a_i`,`same_day_coverage`,`weekend_coverage`,`quote_instantly`,`bind_instantly`,`additional_people`,`additional_charges`,`created_at`,`updated_at`) values 
(29,20,'FDEAN',0,50,25.00,100000,300000,'per_occurrence',0,0,'N/A','N/A','N/A','N/A',1,1,1,1,NULL,NULL,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(30,21,'ASI',0,50,25.00,100000,300000,'per_occurrence',0,0,'N/A','N/A','N/A','N/A',1,1,1,1,NULL,NULL,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(31,21,'FDEAN',0,50,25.00,100000,300000,'per_occurrence',0,0,'N/A','N/A','N/A','N/A',1,1,1,1,NULL,NULL,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(32,23,'ASI',0,50,25.00,100000,300000,'per_occurrence',0,0,'N/A','N/A','N/A','N/A',1,1,1,1,NULL,NULL,'2026-06-03 18:43:21','2026-06-03 18:43:21');

/*Table structure for table `event_types` */

DROP TABLE IF EXISTS `event_types`;

CREATE TABLE `event_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_added` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_types_event_type_index` (`event_type`),
  KEY `event_types_client_added_index` (`client_added`)
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `event_types` */

insert  into `event_types`(`id`,`event_type`,`client_added`,`created_at`,`updated_at`) values 
(1,'Birthday Party',0,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(2,'Birthday Party',0,'2026-06-03 18:43:16','2026-06-03 18:43:16'),
(3,'Birthday Party',0,'2026-06-03 18:43:16','2026-06-03 18:43:16'),
(4,'Birthday Party',0,'2026-06-03 18:43:16','2026-06-03 18:43:16'),
(5,'Birthday Party',0,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(6,'Birthday Party',0,'2025-06-14 19:00:00','2025-06-14 19:00:00'),
(7,'Birthday Party',0,'2025-06-16 19:00:00','2025-06-16 19:00:00'),
(8,'Birthday Party',0,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(9,'Vendor at Event',0,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(10,'Wedding Reception',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(11,'Wedding Reception',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(12,'Birthday Party',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(13,'Birthday Party',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(14,'Birthday Party',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(15,'Birthday Party',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(16,'Birthday Party',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(17,'sit deleniti',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(18,'aut quas',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(19,'a quas',0,'2026-06-03 18:43:20','2026-06-03 18:43:20'),
(20,'amet omnis',0,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(21,'exercitationem temporibus',0,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(22,'est temporibus',0,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(23,'libero laudantium',0,'2026-06-03 18:43:21','2026-06-03 18:43:21');

/*Table structure for table `failed_jobs` */

DROP TABLE IF EXISTS `failed_jobs`;

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `failed_jobs` */

/*Table structure for table `invoice_coverage_lines` */

DROP TABLE IF EXISTS `invoice_coverage_lines`;

CREATE TABLE `invoice_coverage_lines` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint unsigned NOT NULL,
  `benefit_type` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `benefit_value` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_coverage_lines_invoice_id_index` (`invoice_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoice_coverage_lines` */

/*Table structure for table `invoice_line_items` */

DROP TABLE IF EXISTS `invoice_line_items`;

CREATE TABLE `invoice_line_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `policy` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fee_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(8,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_line_items_invoice_id_index` (`invoice_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoice_line_items` */

/*Table structure for table `invoice_sender_profiles` */

DROP TABLE IF EXISTS `invoice_sender_profiles`;

CREATE TABLE `invoice_sender_profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `agency_id` bigint unsigned NOT NULL,
  `company_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_first_name` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_last_name` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_ext` varchar(14) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` char(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipcode` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_sender_profiles_agency_id_is_active_index` (`agency_id`,`is_active`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoice_sender_profiles` */

/*Table structure for table `invoice_templates` */

DROP TABLE IF EXISTS `invoice_templates`;

CREATE TABLE `invoice_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `agency_id` bigint unsigned DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template` text COLLATE utf8mb4_unicode_ci,
  `added_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_templates_agency_id_foreign` (`agency_id`),
  KEY `invoice_templates_added_by_foreign` (`added_by`),
  KEY `invoice_templates_updated_by_foreign` (`updated_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoice_templates` */

/*Table structure for table `invoices` */

DROP TABLE IF EXISTS `invoices`;

CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `type` enum('single','multi_plan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `encode_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_cc` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_bcc` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_subject` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrier` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `min_limit` int unsigned DEFAULT NULL,
  `max_limit` int unsigned DEFAULT NULL,
  `broker_fee` decimal(8,2) DEFAULT NULL,
  `processing_fee` decimal(8,2) DEFAULT NULL,
  `total_premium` decimal(8,2) DEFAULT NULL,
  `total_payable` decimal(8,2) DEFAULT NULL,
  `street` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suite` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plans` json DEFAULT NULL,
  `invoice_status` tinyint NOT NULL DEFAULT '0',
  `paypal_response` text COLLATE utf8mb4_unicode_ci,
  `paypal_transaction_id` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_timezone` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_encode_id_unique` (`encode_id`),
  KEY `invoices_created_by_foreign` (`created_by`),
  KEY `invoices_lead_id_invoice_status_index` (`lead_id`,`invoice_status`),
  KEY `invoices_email_index` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoices` */

insert  into `invoices`(`id`,`lead_id`,`created_by`,`type`,`encode_id`,`first_name`,`last_name`,`email`,`email_cc`,`email_bcc`,`email_subject`,`event_type`,`carrier`,`effective_date`,`expiration_date`,`min_limit`,`max_limit`,`broker_fee`,`processing_fee`,`total_premium`,`total_payable`,`street`,`suite`,`city`,`state`,`zip`,`plans`,`invoice_status`,`paypal_response`,`paypal_transaction_id`,`user_timezone`,`created_at`,`updated_at`) values 
(1,87,1,'single','1XQ0QCSK','Dimitri','Weber','enid.weimann@example.org',NULL,NULL,NULL,'Birthday','ASI','2026-06-18','2027-08-11',NULL,NULL,20.00,5.00,179.07,204.07,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12'),
(2,87,1,'single','ZE6WYYRN','Jeremy','Wiza','bruen.alyson@example.net',NULL,NULL,NULL,'Birthday','ASI','2026-08-20','2027-06-23',NULL,NULL,20.00,5.00,449.22,474.22,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12'),
(3,87,1,'single','ZPVHC7ZO','Destin','Breitenberg','turner.justen@example.org',NULL,NULL,NULL,'Festival','Markel','2027-01-21','2028-02-06',NULL,NULL,20.00,5.00,302.30,327.30,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12'),
(4,102,1,'single','ZEAN1DNY','Sandra','Kuhic','ctromp@example.org',NULL,NULL,NULL,'Festival','Markel','2026-08-20','2027-06-06',NULL,NULL,20.00,5.00,278.16,303.16,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(5,102,1,'single','G9T6IIDG','Jeramy','Fay','german.rodriguez@example.org',NULL,NULL,NULL,'Corporate','Nationwide','2027-06-02','2027-12-26',NULL,NULL,20.00,5.00,109.89,134.89,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(6,102,1,'single','3CKQVO9Z','Ruth','Jaskolski','felicity22@example.com',NULL,NULL,NULL,'Corporate','ASI','2026-12-28','2027-06-24',NULL,NULL,20.00,5.00,359.53,384.53,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(7,103,1,'single','ABC123','Jerrold','Bailey','aoconnell@example.com',NULL,NULL,NULL,'Wedding','ASI','2027-01-25','2027-09-11',NULL,NULL,20.00,5.00,498.61,523.61,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(8,104,1,'single','5EZXI5CI','Luz','Littel','presley.hansen@example.com',NULL,NULL,NULL,'Corporate','Nationwide','2026-11-27','2028-05-31',NULL,NULL,20.00,5.00,375.15,400.15,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(9,104,1,'single','VA7EOS5V','Ettie','O\'Conner','kschinner@example.org',NULL,NULL,NULL,'Festival','Markel','2026-07-23','2027-08-19',NULL,NULL,20.00,5.00,55.63,80.63,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(10,105,1,'single','AYMFYLEN','Efrain','Feest','adurgan@example.com',NULL,NULL,NULL,'Birthday','Markel','2027-05-20','2028-05-16',NULL,NULL,20.00,5.00,423.21,448.21,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(11,105,1,'single','ECFSJPCQ','Rudy','Boyle','una72@example.com',NULL,NULL,NULL,'Wedding','Markel','2026-08-11','2027-11-18',NULL,NULL,20.00,5.00,176.61,201.61,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13');

/*Table structure for table `job_batches` */

DROP TABLE IF EXISTS `job_batches`;

CREATE TABLE `job_batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `job_batches` */

/*Table structure for table `jobs` */

DROP TABLE IF EXISTS `jobs`;

CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `jobs` */

/*Table structure for table `lead_actions` */

DROP TABLE IF EXISTS `lead_actions`;

CREATE TABLE `lead_actions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `action_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_timezone` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_actions_user_id_foreign` (`user_id`),
  KEY `lead_actions_lead_id_index` (`lead_id`),
  KEY `lead_actions_action_type_index` (`action_type`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_actions` */

insert  into `lead_actions`(`id`,`lead_id`,`user_id`,`action_type`,`meta`,`message`,`user_timezone`,`created_at`,`updated_at`) values 
(1,3,12,NULL,NULL,'Lead created manually from the admin CRM.',NULL,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(2,4,13,NULL,NULL,'Lead created manually from the admin CRM.',NULL,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(3,115,235,NULL,NULL,'DocuSign envelope sent: env-new-001',NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14'),
(4,119,NULL,NULL,NULL,'DocuSign envelope completed (signed): env-completed',NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14'),
(5,127,259,'agent_assigned','{\"role\": \"Agent\", \"assignee_id\": 260, \"assignee_name\": \"Meredith Goldner\"}','Meredith Goldner (Agent) assigned to this lead',NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(6,128,261,'agent_assigned','{\"role\": \"Staff\", \"assignee_id\": 262, \"assignee_name\": \"Imani Larkin\"}','Imani Larkin (Staff) assigned to this lead',NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(7,129,263,'agent_assigned','{\"role\": \"Planner\", \"assignee_id\": 264, \"assignee_name\": \"Rhianna Hintz\"}','Rhianna Hintz (Planner) assigned to this lead',NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(8,135,275,'agent_unassigned','{\"assignee_id\": 276, \"assignee_name\": \"Victor Berge\"}','Victor Berge removed from this lead',NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(9,136,277,'agent_unassigned','{\"assignee_id\": 278, \"assignee_name\": \"Roma Crooks\"}','Roma Crooks removed from this lead',NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(10,137,NULL,NULL,'{\"reasons\": [\"Hired / non-owned auto coverage requested\"]}','Manual quote requested — Hired / non-owned auto coverage requested.',NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16'),
(11,138,NULL,NULL,'{\"reasons\": [\"Hired / non-owned auto coverage requested\"]}','Manual quote requested — Hired / non-owned auto coverage requested.',NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16'),
(12,143,295,'pdf_generated',NULL,'Policy & receipt PDF generation queued',NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16'),
(13,144,296,'coi_generated',NULL,'COI auto-generation queued',NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16');

/*Table structure for table `lead_assignment` */

DROP TABLE IF EXISTS `lead_assignment`;

CREATE TABLE `lead_assignment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_assignment_lead_id_user_id_unique` (`lead_id`,`user_id`),
  KEY `lead_assignment_user_id_index` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_assignment` */

insert  into `lead_assignment`(`id`,`lead_id`,`user_id`,`created_at`,`updated_at`) values 
(1,39,157,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(2,40,157,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(3,41,157,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(4,42,158,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(5,43,159,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(6,44,161,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(7,45,162,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(8,46,162,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(9,47,162,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(10,48,162,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(11,49,162,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(12,50,163,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(13,51,164,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(14,53,165,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(15,54,165,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(16,55,166,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(17,56,168,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(18,57,169,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(19,58,170,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(20,60,172,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(21,61,173,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(22,63,175,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(23,64,177,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(24,71,184,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(25,72,185,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(26,81,194,'2026-06-03 18:43:10','2026-06-03 18:43:10'),
(27,125,253,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(28,126,255,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(29,126,256,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(30,126,257,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(31,127,260,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(32,128,262,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(33,129,264,'2026-06-03 18:43:15','2026-06-03 18:43:15'),
(34,132,270,'2026-06-03 18:43:15','2026-06-03 18:43:15');

/*Table structure for table `lead_changes` */

DROP TABLE IF EXISTS `lead_changes`;

CREATE TABLE `lead_changes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `changes_made_by` bigint unsigned DEFAULT NULL,
  `changes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_timezone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_changes_changes_made_by_foreign` (`changes_made_by`),
  KEY `lead_changes_lead_id_index` (`lead_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_changes` */

/*Table structure for table `lead_emails` */

DROP TABLE IF EXISTS `lead_emails`;

CREATE TABLE `lead_emails` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `email_msg_number` int DEFAULT NULL,
  `email_from` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_email_address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `mail_to` text COLLATE utf8mb4_unicode_ci,
  `mail_cc` text COLLATE utf8mb4_unicode_ci,
  `mail_bcc` text COLLATE utf8mb4_unicode_ci,
  `has_attachment` tinyint(1) NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_emails_lead_id_index` (`lead_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_emails` */

/*Table structure for table `lead_files` */

DROP TABLE IF EXISTS `lead_files`;

CREATE TABLE `lead_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `name` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `path` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `send_to_customer` tinyint(1) NOT NULL DEFAULT '0',
  `user_timezone` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_files_lead_id_index` (`lead_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_files` */

/*Table structure for table `lead_follow_ups` */

DROP TABLE IF EXISTS `lead_follow_ups`;

CREATE TABLE `lead_follow_ups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `follow_up_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `reminder_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_follow_ups_created_by_foreign` (`created_by`),
  KEY `lead_follow_ups_lead_id_status_index` (`lead_id`,`status`),
  KEY `lead_follow_ups_user_id_follow_up_date_index` (`user_id`,`follow_up_date`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_follow_ups` */

/*Table structure for table `lead_messages` */

DROP TABLE IF EXISTS `lead_messages`;

CREATE TABLE `lead_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `direction` enum('in','out') COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_internal` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_messages_user_id_foreign` (`user_id`),
  KEY `lead_messages_lead_id_created_at_index` (`lead_id`,`created_at`),
  KEY `lead_messages_direction_index` (`direction`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_messages` */

/*Table structure for table `lead_notes` */

DROP TABLE IF EXISTS `lead_notes`;

CREATE TABLE `lead_notes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `added_by` bigint unsigned NOT NULL,
  `added_for` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_timezone` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lead_notes_added_by_foreign` (`added_by`),
  KEY `lead_notes_lead_id_index` (`lead_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `lead_notes` */

insert  into `lead_notes`(`id`,`lead_id`,`added_by`,`added_for`,`message`,`user_timezone`,`created_at`,`updated_at`) values 
(1,61,173,NULL,'Customer asked to reschedule.',NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09');

/*Table structure for table `leads` */

DROP TABLE IF EXISTS `leads`;

CREATE TABLE `leads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `affiliate_string` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_string` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referred_by_affiliate_id` bigint unsigned DEFAULT NULL,
  `referred_by_planner_id` bigint unsigned DEFAULT NULL,
  `referred_by_customer_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `event_type_id` bigint unsigned DEFAULT NULL,
  `event_type_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `when_event` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `state_id` bigint unsigned DEFAULT NULL,
  `event_state` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_name` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_people` smallint unsigned DEFAULT NULL,
  `event_past_2am` tinyint(1) NOT NULL DEFAULT '0',
  `have_entry_fee` tinyint(1) NOT NULL DEFAULT '0',
  `event_description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alcohol_served` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alcohol_served_by` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alcohol_insurance` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alcohol_additional_insured` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_sold_profitable` tinyint(1) NOT NULL DEFAULT '0',
  `special_activities` tinyint(1) NOT NULL DEFAULT '0',
  `event_special_act_detail` text COLLATE utf8mb4_unicode_ci,
  `bouncehouses` tinyint(1) NOT NULL DEFAULT '0',
  `is_inflatables_coverage` tinyint(1) NOT NULL DEFAULT '0',
  `live_musical_performances` tinyint(1) NOT NULL DEFAULT '0',
  `vendor_activity` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product` int unsigned DEFAULT NULL,
  `carrier` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverage_limit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waiver_sub_status` tinyint(1) NOT NULL DEFAULT '0',
  `hired_status` tinyint(1) NOT NULL DEFAULT '0',
  `primary_basis` tinyint(1) NOT NULL DEFAULT '0',
  `additional_insured` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_insured_details` json DEFAULT NULL,
  `lead_offered_plans` json DEFAULT NULL,
  `email` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `street` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ins_first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ins_last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ins_street` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ins_city` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ins_state` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ins_zip` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_name` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_at_venue` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_address` text COLLATE utf8mb4_unicode_ci,
  `venue_street` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_state` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_zip` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_contact_number` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_contact_email` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `private_residence` tinyint(1) NOT NULL DEFAULT '0',
  `e_signature` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `acknowledge` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `any_claims` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_id` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` tinyint NOT NULL DEFAULT '0',
  `bound` tinyint(1) NOT NULL DEFAULT '0',
  `submission_status` enum('tried','saved','mq','plan_added_manually','payment','payment_received','finished') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tried',
  `status` tinyint NOT NULL DEFAULT '1',
  `closing_reason` tinytext COLLATE utf8mb4_unicode_ci,
  `policy_pdf_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_pdf_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coi_pdf_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pending_ode_quote_link_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pending_quote_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pending_json_form_array` text COLLATE utf8mb4_unicode_ci,
  `pending_changes` json DEFAULT NULL,
  `donation_to` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prefilled_state_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_timezone` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_email_blocked` tinyint(1) NOT NULL DEFAULT '0',
  `post_event_email_sent` tinyint(1) NOT NULL DEFAULT '0',
  `seven_day_reminder_sent` tinyint(1) NOT NULL DEFAULT '0',
  `is_on_hold` tinyint(1) NOT NULL DEFAULT '0',
  `is_chat_blocked` tinyint(1) NOT NULL DEFAULT '0',
  `chat_closed_at` timestamp NULL DEFAULT NULL,
  `is_priority_lead` tinyint(1) NOT NULL DEFAULT '0',
  `commission_status` int NOT NULL DEFAULT '0',
  `requoted_id` int unsigned DEFAULT NULL,
  `type` int DEFAULT NULL,
  `is_charged_ticket` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leads_user_id_foreign` (`user_id`),
  KEY `leads_event_type_id_foreign` (`event_type_id`),
  KEY `leads_state_id_foreign` (`state_id`),
  KEY `leads_event_date_index` (`event_date`),
  KEY `leads_submission_status_status_index` (`submission_status`,`status`),
  KEY `leads_affiliate_string_index` (`affiliate_string`),
  KEY `leads_referral_string_index` (`referral_string`),
  KEY `leads_email_index` (`email`),
  KEY `leads_submission_status_index` (`submission_status`),
  KEY `leads_referred_by_affiliate_id_foreign` (`referred_by_affiliate_id`),
  KEY `leads_referred_by_planner_id_foreign` (`referred_by_planner_id`),
  KEY `leads_referred_by_customer_id_foreign` (`referred_by_customer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `leads` */

insert  into `leads`(`id`,`affiliate_string`,`referral_string`,`referred_by_affiliate_id`,`referred_by_planner_id`,`referred_by_customer_id`,`user_id`,`event_type_id`,`event_type_label`,`when_event`,`event_date`,`start_time`,`state_id`,`event_state`,`event_name`,`no_of_people`,`event_past_2am`,`have_entry_fee`,`event_description`,`alcohol_served`,`alcohol_served_by`,`alcohol_insurance`,`alcohol_additional_insured`,`is_sold_profitable`,`special_activities`,`event_special_act_detail`,`bouncehouses`,`is_inflatables_coverage`,`live_musical_performances`,`vendor_activity`,`product`,`carrier`,`coverage_limit`,`waiver_sub_status`,`hired_status`,`primary_basis`,`additional_insured`,`additional_insured_details`,`lead_offered_plans`,`email`,`phone`,`first_name`,`last_name`,`street`,`city`,`zip`,`ins_first_name`,`ins_last_name`,`ins_street`,`ins_city`,`ins_state`,`ins_zip`,`venue_name`,`contact_at_venue`,`venue_address`,`venue_street`,`venue_state`,`venue_zip`,`venue_contact_number`,`venue_contact_email`,`private_residence`,`e_signature`,`acknowledge`,`any_claims`,`payment_id`,`payment_status`,`bound`,`submission_status`,`status`,`closing_reason`,`policy_pdf_path`,`receipt_pdf_path`,`coi_pdf_path`,`pending_ode_quote_link_id`,`pending_quote_status`,`pending_json_form_array`,`pending_changes`,`donation_to`,`prefilled_state_name`,`user_timezone`,`is_email_blocked`,`post_event_email_sent`,`seven_day_reminder_sent`,`is_on_hold`,`is_chat_blocked`,`chat_closed_at`,`is_priority_lead`,`commission_status`,`requoted_id`,`type`,`is_charged_ticket`,`created_at`,`updated_at`,`deleted_at`) values 
(1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'omnis consequatur',NULL,'2026-10-28',NULL,NULL,'NY','pariatur voluptatibus eligendi',134,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,'2','[{\"zip\": \"90001\", \"city\": \"Los Angeles\", \"name\": \"Acme Venue\", \"email\": \"venue@acme.com\", \"state\": \"CA\", \"street\": \"1 Main St\", \"relation\": \"Venue\"}, {\"zip\": \"90002\", \"city\": \"Los Angeles\", \"name\": \"Bob Caterer\", \"email\": \"\", \"state\": \"CA\", \"street\": \"2 Oak Ave\", \"relation\": \"Caterer\"}]','{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','sanford.abelardo@example.net','+18052315238','Grover','Osinski',NULL,NULL,NULL,'Rickey','Mitchell','2415 Abelardo Drive Suite 019','East Jonas','CA','90210','Hyatt, Konopelski and Rempel',NULL,'6037 Daniel Centers Apt. 421',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:01','2026-06-03 18:43:01',NULL),
(2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'aspernatur tempore',NULL,'2027-02-10',NULL,NULL,'IL','excepturi distinctio id',79,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','justen40@example.com','508-572-1132','Manuela','Kutch',NULL,NULL,NULL,'Lorena','Quitzon','975 Vida Village','Ashtonmouth','CA','90210','Wisoky and Sons',NULL,'4915 Jesus Motorway Apt. 336',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:01','2026-06-03 18:43:01',NULL),
(3,NULL,NULL,NULL,NULL,NULL,NULL,1,'Birthday Party',NULL,'2031-06-18',NULL,NULL,'CA',NULL,80,0,0,NULL,'none',NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,'0',NULL,'{\"total\": 140, \"carrier\": \"ASI\", \"premium\": 100, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 35, \"processing_fee\": 5}','carl@example.com','5550001111','Carl','Customer',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'plan_added_manually',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:02','2026-06-03 18:43:02',NULL),
(4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Birthday Party',NULL,'2031-06-18',NULL,NULL,'CA',NULL,80,0,0,NULL,'none',NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,'0',NULL,NULL,'carl@example.com','5550001111','Carl','Customer',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'mq',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:02','2026-06-03 18:43:02',NULL),
(5,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'itaque quo',NULL,'2027-04-06',NULL,NULL,'FL','quis aliquam iste',14,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','arch.kuphal@example.org','(541) 478-6972','Kelton','Purdy',NULL,NULL,NULL,'Raegan','Prohaska','790 Klein Valleys Apt. 791','Port Weldon','CA','90210','Schulist, Langworth and Weimann',NULL,'693 Neoma Rue Apt. 401',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,1,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:02','2026-06-03 18:43:02',NULL),
(6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'aut eum',NULL,'2027-03-31',NULL,NULL,'TX','eaque est maxime',55,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','hill.green@example.com','(571) 210-6070','Bonnie','Kuhn',NULL,NULL,NULL,'Angie','Baumbach','5798 Modesta Vista','North Chester','CA','90210','Gutkowski Group',NULL,'321 Vella Drive Apt. 353',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:02','2026-06-03 18:43:02',NULL),
(7,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'quos non',NULL,'2026-07-05',NULL,NULL,'NY','enim quo nihil',233,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lowe.myles@example.net','(435) 564-6278','Kelsie','Weber',NULL,NULL,NULL,'Burnice','Ferry','561 Parisian Manors Apt. 125','Lake Eugene','CA','90210','Feeney, Bartell and Beer',NULL,'725 Roberts Points Suite 954',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'suscipit similique',NULL,'2027-04-13',NULL,NULL,'FL','maiores at omnis',115,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','itillman@example.com','+1.352.698.5126','Holden','Wyman',NULL,NULL,NULL,'Judson','Legros','1051 Deanna Walks','Boganshire','CA','90210','Ullrich, Wyman and Rowe',NULL,'44593 Tremblay Circle Apt. 099',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'culpa nemo',NULL,'2026-08-21',NULL,NULL,'FL','quod fuga consequatur',28,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ellsworth.mitchell@example.com','+1-443-774-6580','Gay','Predovic',NULL,NULL,NULL,'Erna','Doyle','29525 Daija Brook Apt. 274','Auerhaven','CA','90210','Wyman and Sons',NULL,'77164 Edythe Meadow Apt. 676',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'qui inventore',NULL,'2027-02-10',NULL,NULL,'FL','hic ducimus consequatur',281,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','mkshlerin@example.com','+13528888422','Rocky','Wilkinson',NULL,NULL,NULL,'Ahmad','Haley','4077 Gerhold Creek','South Louberg','CA','90210','Swaniawski-Runte',NULL,'71427 Pasquale Point',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(11,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'cumque est',NULL,'2026-12-24',NULL,NULL,'NY','laborum quasi sit',138,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','marilie98@example.org','+1 (930) 606-5304','Rogers','Barton',NULL,NULL,NULL,'D\'angelo','Jacobson','3803 Uriah Point','Lake Marianside','CA','90210','Franecki, Gusikowski and Schmeler',NULL,'60142 Ludwig Tunnel Suite 178',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'consectetur autem',NULL,'2027-01-29',NULL,NULL,'NY','et ut quod',71,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lucie50@example.com','(484) 941-3680','Don','Dicki',NULL,NULL,NULL,'Gilbert','Jakubowski','5899 Morar Parkways Apt. 041','Port Cathrynmouth','CA','90210','Will Ltd',NULL,'360 Leonor Courts Suite 702',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(13,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'numquam adipisci',NULL,'2027-01-02',NULL,NULL,'TX','suscipit doloribus quaerat',129,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','larkin.carmella@example.net','+1 (775) 763-1176','Eloy','Howell',NULL,NULL,NULL,'Jocelyn','Dickinson','99350 Sven Circle Apt. 254','Abernathyfurt','CA','90210','McDermott, Kuvalis and Littel',NULL,'19279 Bartoletti Station Suite 387',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(14,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ducimus illum',NULL,'2026-09-23',NULL,NULL,'TX','temporibus quam magni',170,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','tommie.funk@example.org','234-520-3903','Delphine','O\'Connell',NULL,NULL,NULL,'Abbie','Ledner','3561 Lakin Alley','East Elouiseburgh','CA','90210','Heller Inc',NULL,'81420 Tracy Path Suite 534',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'fugit rerum',NULL,'2027-04-04',NULL,NULL,'FL','quas quis numquam',103,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','mschoen@example.org','+1.585.809.1501','Daphnee','Gutmann',NULL,NULL,NULL,'Wade','Cronin','547 Orn Curve Suite 263','Lemketown','CA','90210','Lind, O\'Keefe and Reynolds',NULL,'41674 Predovic Square Suite 080',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'exercitationem et',NULL,'2027-04-08',NULL,NULL,'IL','quam exercitationem ea',241,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','sid.lemke@example.com','+1-321-425-1499','Skyla','Volkman',NULL,NULL,NULL,'Dusty','Rempel','815 Gerlach Row','Kohlerport','CA','90210','Kling, Kilback and Skiles',NULL,'451 Casper Park',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'non rerum',NULL,'2027-01-08',NULL,NULL,'TX','provident et dolores',201,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','elisa57@example.com','1-575-256-3095','Bernita','Kuhlman',NULL,NULL,NULL,'Sandrine','Friesen','754 Wuckert Mall Apt. 787','East Esteban','CA','90210','Borer PLC',NULL,'199 Rowe Plain Suite 106',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'et similique',NULL,'2027-05-11',NULL,NULL,'TX','perferendis blanditiis at',127,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jasen.haley@example.com','564-374-3647','Brayan','Koepp',NULL,NULL,NULL,'Susan','Mueller','1284 Rosalia Mission','East Aracely','CA','90210','Bradtke, Weimann and Romaguera',NULL,'92222 Hegmann Mount Suite 113',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(19,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'deleniti reprehenderit',NULL,'2026-07-31',NULL,NULL,'TX','quibusdam ut et',131,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ocie93@example.com','1-412-425-7239','Hazle','Berge',NULL,NULL,NULL,'Valentina','Raynor','21895 Walsh Radial','New Babyhaven','CA','90210','Beatty LLC',NULL,'53268 Ansley View',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(20,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'natus deleniti',NULL,'2027-02-26',NULL,NULL,'NY','molestiae qui ut',131,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','nluettgen@example.org','+16786929617','Loma','Upton',NULL,NULL,NULL,'Irving','Torphy','529 Jadyn Cove Apt. 560','East Angelinaburgh','CA','90210','Bogisich PLC',NULL,'572 Kilback Track Suite 131',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(21,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'in suscipit',NULL,'2027-05-20',NULL,NULL,'TX','sit officiis architecto',271,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','bbreitenberg@example.com','+1.754.416.9568','Aryanna','Stark',NULL,NULL,NULL,'Abe','Dooley','625 Kaitlin Alley','Kirstinfurt','CA','90210','Rice, Eichmann and Pagac',NULL,'548 Alba Rest Apt. 995',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(22,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'omnis maiores',NULL,'2027-04-18',NULL,NULL,'IL','ab laboriosam sunt',133,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jakubowski.iva@example.net','1-708-368-1773','Yazmin','Buckridge',NULL,NULL,NULL,'Hope','Schumm','284 Annamae Walk Apt. 584','Port Doyleland','CA','90210','Gorczany, Blanda and Waelchi',NULL,'13141 Magnolia Field',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'sit quod',NULL,'2027-02-01',NULL,NULL,'FL','nemo delectus dolor',82,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','hans.wisozk@example.org','509.894.4189','Eloisa','Renner',NULL,NULL,NULL,'Cassie','Hilpert','644 Murazik Islands','New Cale','CA','90210','White-Koch',NULL,'837 Nannie Roads',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(24,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'laudantium vel',NULL,'2027-02-26',NULL,NULL,'NY','occaecati consectetur temporibus',30,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','bobby03@example.net','(502) 713-2064','Delia','Gerlach',NULL,NULL,NULL,'Nona','O\'Hara','29931 Jailyn Mills','Omerside','CA','90210','Ullrich-Jacobs',NULL,'395 Larson Island',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(25,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'et quo',NULL,'2026-11-25',NULL,NULL,'FL','dicta necessitatibus nostrum',287,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kbatz@example.org','854.486.4409','Verla','Feeney',NULL,NULL,NULL,'Madaline','Nikolaus','6887 Maude Throughway','Bartholometon','CA','90210','Grant, Champlin and Bruen',NULL,'5819 Turner Highway',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(26,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dignissimos nulla',NULL,'2026-08-21',NULL,NULL,'NY','pariatur itaque sequi',246,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','igorczany@example.com','+1-712-852-3168','Myrtle','Little',NULL,NULL,NULL,'Garry','Jenkins','3208 Sophie Knolls','Tobinchester','CA','90210','Wintheiser LLC',NULL,'7453 Runolfsdottir Dale Apt. 223',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(27,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'sed dolores',NULL,'2027-04-04',NULL,NULL,'IL','exercitationem excepturi eos',81,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','eleazar.hackett@example.com','415-588-8244','Dakota','Hettinger',NULL,NULL,NULL,'Jonatan','Spinka','27143 Monahan Key Suite 923','Robelberg','CA','90210','Rath-Goodwin',NULL,'9562 Hoppe Road',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'labore veniam',NULL,'2026-12-07',NULL,NULL,'IL','ut reiciendis numquam',177,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kayla60@example.com','864-220-8441','Sharon','Maggio',NULL,NULL,NULL,'Edd','Heller','793 Hammes Junctions Apt. 333','Maiafurt','CA','90210','Abernathy, Gleason and Kautzer',NULL,'455 Robb Expressway',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(29,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'eum et',NULL,'2026-10-26',NULL,NULL,'CA','non ducimus inventore',238,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','odickens@example.net','1-854-574-5918','Everett','Braun',NULL,NULL,NULL,'Abner','Zulauf','77941 Carleton Passage Suite 392','East Magdalenahaven','CA','90210','Aufderhar-Casper',NULL,'81077 Ana Pass Suite 918',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'quae ut',NULL,'2026-08-23',NULL,NULL,'NY','adipisci sapiente dicta',158,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ckuhic@example.com','+1-562-637-0106','Jermaine','Hirthe',NULL,NULL,NULL,'Edgardo','Raynor','26962 Abraham Squares','Wisozkton','CA','90210','Block-Brekke',NULL,'138 Sawayn Plains Suite 444',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'est enim',NULL,'2027-02-20',NULL,NULL,'CA','rem iure soluta',123,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','oreichel@example.org','385.612.2926','Magdalena','Upton',NULL,NULL,NULL,'Wava','Balistreri','74026 Agustin Turnpike','Miaton','CA','90210','Baumbach, Jacobi and Homenick',NULL,'9909 Dayana Lights',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(32,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'repellendus consequatur',NULL,'2026-08-23',NULL,NULL,'CA','dolor eos at',255,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jimmie.fritsch@example.com','(463) 657-9654','Amy','Rowe',NULL,NULL,NULL,'Callie','Macejkovic','2964 Macy Summit','North Janicebury','CA','90210','Cartwright Inc',NULL,'6171 Trevor Plaza',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:04','2026-06-03 18:43:04',NULL),
(33,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'aut at',NULL,'2026-10-15',NULL,NULL,'TX','qui vel fugiat',112,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','parisian.brennan@example.com','+13808339432','Marquis','Ebert',NULL,NULL,NULL,'Zelda','Romaguera','8894 Dickens Mills','South Luisa','CA','90210','Roob, Rutherford and Reynolds',NULL,'1489 Gibson Mill Apt. 449',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05',NULL),
(34,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dolores accusamus',NULL,'2027-02-19',NULL,NULL,'CA','adipisci ut qui',156,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lisa.harris@example.net','1-360-522-7279','Davon','Berge',NULL,NULL,NULL,'Minnie','Nitzsche','8754 Strosin Cliffs Suite 291','Verniceport','CA','90210','Ryan-Nader',NULL,'1461 Brooke Spurs Suite 054',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05',NULL),
(35,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'velit qui',NULL,'2027-03-22',NULL,NULL,'CA','natus molestias molestiae',275,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','tyson96@example.com','+1-571-527-1031','Edward','Little',NULL,NULL,NULL,'Grover','VonRueden','72646 Tate Fields','Denesikborough','CA','90210','Pfeffer Inc',NULL,'104 Darian Shoals Suite 475',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05',NULL),
(36,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'et officiis',NULL,'2026-09-28',NULL,NULL,'TX','reprehenderit qui soluta',247,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lemuel.torphy@example.com','1-667-852-0367','Nicolette','Reynolds',NULL,NULL,NULL,'Dorris','Armstrong','1708 Juliana Ranch','West Claudemouth','CA','90210','Fadel-Walsh',NULL,'576 Oma Fall Suite 972',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05',NULL),
(37,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'modi nesciunt',NULL,'2027-01-11',NULL,NULL,'TX','cupiditate amet sit',227,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ernser.callie@example.net','+17622994645','Alexys','Waelchi',NULL,NULL,NULL,'Leland','Wunsch','383 Lafayette Shores Suite 520','Kuvalisport','CA','90210','Bogan Inc',NULL,'8972 Adeline Key',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05',NULL),
(38,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'non officiis',NULL,'2027-05-15',NULL,NULL,'FL','omnis eos dolorum',92,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kaitlyn96@example.org','(502) 899-9212','Jeramie','Waters',NULL,NULL,NULL,'Vito','Williamson','2782 Astrid Common Suite 032','North Ursula','CA','90210','Schuppe LLC',NULL,'54614 Gaylord Plain',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:05','2026-06-03 18:43:05',NULL),
(39,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'error sit',NULL,'2026-12-28',NULL,NULL,'IL','expedita rem est',269,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','fmuller@example.net','(484) 555-4572','Abelardo','Shanahan',NULL,NULL,NULL,'Hilton','Greenfelder','3055 Allen Orchard Suite 611','Ethelynburgh','CA','90210','Moore LLC',NULL,'954 Magali Freeway Apt. 057',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(40,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'eum illum',NULL,'2027-03-26',NULL,NULL,'TX','voluptatem libero cumque',211,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','udouglas@example.net','615-577-9527','Otho','Schuster',NULL,NULL,NULL,'Cali','Deckow','8314 Teresa Centers','Lake Joesphchester','CA','90210','Denesik, Bergnaum and Feeney',NULL,'53784 Moen Knolls Apt. 742',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(41,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'libero illum',NULL,'2027-04-28',NULL,NULL,'FL','voluptatem labore sapiente',190,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','wlangworth@example.org','347.290.0493','Lexus','Morar',NULL,NULL,NULL,'Hazel','Romaguera','1379 Pascale Meadows Apt. 446','Lake Cristopherborough','CA','90210','Nolan, Larkin and Bogan',NULL,'1635 Cornelius Pine Apt. 074',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(42,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'itaque velit',NULL,'2026-12-13',NULL,NULL,'IL','rem quam quam',299,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lparker@example.org','1-352-860-9550','Krista','Williamson',NULL,NULL,NULL,'Elmore','Wisoky','3667 Heller Keys Apt. 222','McClureside','CA','90210','Ratke, Prohaska and Parisian',NULL,'130 Libbie Forge Apt. 261',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(43,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'voluptates itaque',NULL,'2026-11-18',NULL,NULL,'TX','earum dolor aliquam',284,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','casimir37@example.net','+1.828.440.0831','Verner','O\'Kon',NULL,NULL,NULL,'Edwina','Heathcote','674 Gerlach Drives','Treyburgh','CA','90210','Schowalter-Douglas',NULL,'63382 Eloy Bridge',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(44,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'id eos',NULL,'2026-08-19',NULL,NULL,'IL','et nisi soluta',150,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','karina.brekke@example.org','1-938-693-6936','Harry','Bradtke',NULL,NULL,NULL,'Kristin','Rutherford','24825 Marcella Crossroad','Libbyhaven','CA','90210','Steuber, Wisoky and Rau',NULL,'6658 Stark Burgs',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(45,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'occaecati quae',NULL,'2026-11-18',NULL,NULL,'IL','fuga dolore laborum',185,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','raoul.baumbach@example.org','+18506597512','Jean','O\'Conner',NULL,NULL,NULL,'Kolby','Ritchie','82901 Dibbert Forest','Gutkowskishire','CA','90210','Will Group',NULL,'17494 Cruickshank Canyon Apt. 170',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(46,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nisi molestiae',NULL,'2027-03-13',NULL,NULL,'TX','fugiat quo qui',132,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rosetta07@example.org','+14409483639','Josiah','Barrows',NULL,NULL,NULL,'Randal','Pagac','102 D\'angelo Passage','Skilesside','CA','90210','Hodkiewicz-Casper',NULL,'4602 Amalia Skyway',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(47,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'in optio',NULL,'2026-09-14',NULL,NULL,'IL','iste officiis enim',98,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','huels.augusta@example.com','+1-305-594-9240','Veda','Labadie',NULL,NULL,NULL,'Benton','Considine','2605 Balistreri Plains Apt. 178','Goyettemouth','CA','90210','Lehner-Murazik',NULL,'2604 Roy Crossroad',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(48,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'rem ipsum',NULL,'2026-07-05',NULL,NULL,'NY','explicabo consequatur aspernatur',106,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','alta59@example.com','+13616255975','Shemar','Denesik',NULL,NULL,NULL,'Alena','Beatty','43868 Virgie Path Suite 293','East Raquel','CA','90210','McDermott-Pfannerstill',NULL,'67672 O\'Connell Camp Apt. 955',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(49,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'autem ut',NULL,'2026-12-20',NULL,NULL,'FL','ab tenetur aut',277,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lauren.lockman@example.org','248-245-1000','Carmine','Hackett',NULL,NULL,NULL,'Assunta','Stroman','9344 Luciano Vista','West Kathlynton','CA','90210','Hettinger, Nikolaus and McCullough',NULL,'228 Erdman Rest Apt. 544',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'quos eligendi',NULL,'2027-01-23',NULL,NULL,'IL','voluptatem ut velit',104,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','leuschke.rhett@example.org','224.231.8926','Isadore','Upton',NULL,NULL,NULL,'Kaitlin','Walker','9326 Kling Tunnel Apt. 358','North Rosalindborough','CA','90210','Thiel Group',NULL,'766 Heidenreich Plains',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(51,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'fugit similique',NULL,'2026-10-21',NULL,NULL,'FL','dolorum molestiae aliquid',224,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','amanda32@example.net','+1-253-854-7074','Leif','Jast',NULL,NULL,NULL,'Deborah','Marvin','6626 Kuvalis Ramp','Jaskolskiport','CA','90210','Herman, Kohler and Mertz',NULL,'23615 Fritsch View Apt. 689',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(52,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'officiis nostrum',NULL,'2026-08-03',NULL,NULL,'CA','sunt magni quia',31,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','maximilian43@example.net','(517) 970-4836','Felicity','Stiedemann',NULL,NULL,NULL,'Davion','Goodwin','318 Toy Roads Apt. 617','Mosciskiside','CA','90210','Abernathy-Russel',NULL,'6612 Joan Station',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(53,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'corporis maxime',NULL,'2026-12-04',NULL,NULL,'CA','nam quidem maxime',44,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lesch.isaac@example.org','856-354-5041','Cheyanne','Rosenbaum',NULL,NULL,NULL,'Dina','Bins','6811 Gloria Trail Apt. 510','Schneiderville','CA','90210','Krajcik, Shields and Mohr',NULL,'316 Esther Locks Suite 181',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(54,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'asperiores veritatis',NULL,'2026-11-15',NULL,NULL,'NY','aut et maxime',59,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','harvey.ada@example.net','657.263.7718','Celine','Morar',NULL,NULL,NULL,'Patsy','Bayer','810 Braun Lakes Apt. 123','Port Manuel','CA','90210','Fadel, Ratke and Watsica',NULL,'8331 Cordia Hills',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'tried',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(55,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'molestiae aut',NULL,'2027-05-23',NULL,NULL,'IL','ea aliquam impedit',178,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','vbarrows@example.org','480-714-2976','Trisha','Franecki',NULL,NULL,NULL,'Lexus','Walter','88251 Josefina Parks Apt. 885','Collinsberg','CA','90210','Treutel Ltd',NULL,'1535 Glover Motorway Apt. 682',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:08','2026-06-03 18:43:08',NULL),
(56,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'qui sequi',NULL,'2027-03-10',NULL,NULL,'TX','nihil omnis officia',72,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','bquitzon@example.org','678-791-1583','Briana','West',NULL,NULL,NULL,'Layne','Howell','54709 Jedediah Crossing','O\'Kontown','CA','90210','Weimann and Sons',NULL,'55020 Jacobi Ports',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(57,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'cupiditate perspiciatis',NULL,'2026-10-06',NULL,NULL,'NY','eos animi et',268,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','zsawayn@example.com','248-428-5074','Nelson','Johnston',NULL,NULL,NULL,'Aidan','Runolfsdottir','9549 Schultz Point','West Jennifermouth','CA','90210','Homenick, Sawayn and Howe',NULL,'1407 Ava Station',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(58,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'eveniet eaque',NULL,'2027-05-10',NULL,NULL,'NY','aut qui autem',196,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','thiel.murl@example.org','667-633-9627','Arturo','Aufderhar',NULL,NULL,NULL,'Brannon','Nienow','90633 Morissette Crossroad','Lake Willa','CA','90210','Hill-Lowe',NULL,'175 Myah Stravenue Apt. 863',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,1,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(59,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'accusantium ipsum',NULL,'2026-09-12',NULL,NULL,'CA','culpa accusantium sunt',173,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ardella69@example.org','1-361-798-3172','Shania','Cummerata',NULL,NULL,NULL,'Deven','McGlynn','3801 Leonora Fall Suite 976','Bufordtown','CA','90210','Runte Ltd',NULL,'958 Prohaska Fords Suite 143',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(60,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'at autem',NULL,'2026-11-08',NULL,NULL,'NY','et quas et',110,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','original@example.com','+1-425-803-0392','Frances','Koch',NULL,NULL,NULL,'Orland','Schiller','6293 Vivianne Fort Apt. 200','East Clementinafurt','CA','90210','Weber Group',NULL,'992 Abernathy Ville Suite 054',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(61,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ad sequi',NULL,'2026-10-24',NULL,NULL,'NY','aut fugit quos',273,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jovani.kunde@example.com','+1-574-762-0488','Juwan','Pacocha',NULL,NULL,NULL,'Herminia','Collier','311 Waelchi Camp','South Jodyborough','CA','90210','Walker, Armstrong and Wilkinson',NULL,'2243 Georgette Terrace',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(62,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'recusandae iste',NULL,'2026-10-09',NULL,NULL,'TX','est quam corrupti',164,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','myrtis.macejkovic@example.com','332.492.6678','Walter','Wisoky',NULL,NULL,NULL,'Brannon','Adams','2524 Guillermo Expressway Suite 875','Doyleport','CA','90210','Ankunding Inc',NULL,'9233 Kavon Ports Suite 032',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(63,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'doloremque id',NULL,'2026-11-01',NULL,NULL,'TX','cumque ipsam tempore',154,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','margarette.lemke@example.net','1-480-312-8678','Stewart','Bernhard',NULL,NULL,NULL,'Lillie','Cole','47421 Issac Pine','Matthaven','CA','90210','Kassulke-Konopelski',NULL,'5734 Chase Drives',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(64,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'et dicta',NULL,'2026-12-01',NULL,NULL,'FL','delectus dolorem voluptas',130,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','arno59@example.net','1-341-609-0702','Zetta','Marquardt',NULL,NULL,NULL,'Stacey','Jenkins','416 Kreiger Cliff Apt. 868','Ebertshire','CA','90210','Lockman, Morar and Jacobson',NULL,'96242 Lueilwitz Circles Apt. 688',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(65,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'sit iste',NULL,'2026-10-19',NULL,NULL,'TX','itaque nulla fuga',86,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','wyman.conroy@example.com','442.345.9260','Skyla','Ledner',NULL,NULL,NULL,'Rozella','Lockman','12782 Clarissa Points Apt. 294','Port Alivia','CA','90210','Leannon-Moen',NULL,'1218 Alphonso Mountain Suite 209',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(66,NULL,NULL,180,NULL,NULL,NULL,NULL,'odio eaque',NULL,'2026-11-14',NULL,NULL,'FL','deserunt et sint',291,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','otilia97@example.org','1-843-251-8794','Loyce','Hagenes',NULL,NULL,NULL,'Kaden','Sipes','2894 Kuhic Rue Suite 577','New Silasbury','CA','90210','Kerluke, Bogan and Erdman',NULL,'977 Steve Trail Suite 393',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:09','2026-06-03 18:43:09',NULL),
(67,'MYCODE123',NULL,NULL,NULL,NULL,NULL,NULL,'consequatur aspernatur',NULL,'2027-04-20',NULL,NULL,'TX','veniam iusto soluta',240,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','mueller.kaela@example.org','1-847-232-0046','Yesenia','Bradtke',NULL,NULL,NULL,'Vita','Konopelski','84225 Jacky Route','Lake Brodychester','CA','90210','Flatley-Lehner',NULL,'5636 Hane Crescent Suite 581',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(68,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'officiis quia',NULL,'2027-02-23',NULL,NULL,'NY','aut quod magni',209,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','satterfield.adrain@example.com','1-901-212-1162','Hilario','Cummings',NULL,NULL,NULL,'Blanche','Denesik','500 Dibbert Lakes','West Pinkport','CA','90210','White-Hermann',NULL,'687 Jany Turnpike Suite 968',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(69,NULL,NULL,182,NULL,NULL,NULL,NULL,'eos voluptate',NULL,'2026-09-02',NULL,NULL,'CA','cumque quidem ullam',202,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kutch.roberto@example.com','+1-979-716-0003','Elmira','Deckow',NULL,NULL,NULL,'Sienna','Terry','180 Beau Islands','East Dianna','CA','90210','Fritsch Group',NULL,'41400 Leannon Stream Apt. 329',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(70,NULL,NULL,183,NULL,NULL,NULL,NULL,'qui doloribus',NULL,'2026-08-24',NULL,NULL,'TX','voluptatibus quo distinctio',127,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 225, \"carrier\": \"ASI\", \"premium\": 200, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 5}','lauriane99@example.org','203-574-4561','Shyann','Gaylord',NULL,NULL,NULL,'Deion','Raynor','1363 Krajcik Glens Apt. 950','New Jaquelinstad','CA','90210','Jacobs Group',NULL,'560 Block Green Suite 625',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(71,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dolor iste',NULL,'2026-07-11',NULL,NULL,'IL','quos labore vitae',38,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 125, \"carrier\": \"ASI\", \"premium\": 100, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 5}','ucartwright@example.com','1-380-361-4534','Alphonso','Lindgren',NULL,NULL,NULL,'Jacynthe','Goldner','79418 Blanda Road','Balistrerishire','CA','90210','Treutel Group',NULL,'177 Bartell Ways',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(72,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'eum porro',NULL,'2027-03-19',NULL,NULL,'CA','magnam esse alias',166,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 225, \"carrier\": \"ASI\", \"premium\": 200, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 5}','yesenia41@example.org','(713) 862-7333','Hubert','Rau',NULL,NULL,NULL,'Elisabeth','Ratke','23938 Kessler Port','Krajcikton','CA','90210','Kautzer Inc',NULL,'1870 Skyla Village Suite 583',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(73,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'similique autem',NULL,'2026-09-28',NULL,NULL,'CA','quaerat ex iusto',175,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 125, \"carrier\": \"ASI\", \"premium\": 100, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 5}','king.maud@example.org','+1.541.983.6364','Lisandro','Zboncak',NULL,NULL,NULL,'Domenic','Price','39993 Virginie Port','North Nicklaus','CA','90210','Kihn, Treutel and Flatley',NULL,'6233 Sauer Parkways Suite 199',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(74,NULL,NULL,NULL,186,NULL,NULL,NULL,'quia minus',NULL,'2026-11-20',NULL,NULL,'NY','earum officia et',274,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','oda.harvey@example.com','+1.878.450.8398','Glenda','Kerluke',NULL,NULL,NULL,'Mertie','Gerlach','206 Hermann Garden Suite 302','North Dolores','CA','90210','Bednar-Walter',NULL,'81645 Thiel Spurs',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(75,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'accusamus nostrum',NULL,'2026-07-17',NULL,NULL,'IL','ipsa saepe sit',164,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','pkub@example.com','1-657-703-3428','Monica','Barton',NULL,NULL,NULL,'Maximilian','Braun','8279 Welch Lakes Apt. 940','New Wilhelmine','CA','90210','Koch, Smith and Sauer',NULL,'5081 Barrett Road',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(76,NULL,NULL,NULL,NULL,187,NULL,NULL,'modi consequuntur',NULL,'2027-02-15',NULL,NULL,'NY','perferendis modi voluptatem',75,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','dorian.gaylord@example.net','845-730-5087','Myriam','Emmerich',NULL,NULL,NULL,'William','Raynor','61714 Hyatt Station','Nilsport','CA','90210','Pfannerstill-Bednar',NULL,'8590 Larry Mews',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(77,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'doloribus ut',NULL,'2026-11-28',NULL,NULL,'IL','dolorem sit cum',198,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','aspinka@example.net','(737) 243-4676','Eldridge','Fadel',NULL,NULL,NULL,'Johan','Waters','49669 Chet Springs','Spencerport','CA','90210','Runolfsdottir, Crooks and Mueller',NULL,'1214 Kuphal Ranch Suite 416',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(78,NULL,NULL,188,NULL,NULL,NULL,NULL,'amet ut',NULL,'2027-03-25',NULL,NULL,'IL','ex repellendus voluptatibus',132,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','camilla59@example.org','1-205-318-4057','Modesto','Toy',NULL,NULL,NULL,'Mekhi','Lebsack','7040 Gleason Mountains','Rafaelhaven','CA','90210','Glover-Legros',NULL,'40191 Halle Place',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(79,NULL,NULL,NULL,189,NULL,NULL,NULL,'similique quo',NULL,'2027-01-17',NULL,NULL,'NY','quaerat perferendis nostrum',117,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','grayson.kiehn@example.org','+1-272-663-3280','Alia','Heaney',NULL,NULL,NULL,'Thad','Kozey','567 Michel Garden Apt. 468','North Otha','CA','90210','Rolfson Ltd',NULL,'70670 Stracke Loop',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(80,NULL,NULL,NULL,NULL,190,NULL,NULL,'et maxime',NULL,'2027-03-26',NULL,NULL,'CA','enim delectus nostrum',75,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','eliza.bergnaum@example.com','1-563-649-3650','Jeremie','Wilderman',NULL,NULL,NULL,'Marian','Wintheiser','711 Kub Canyon','Lake Janellestad','CA','90210','O\'Keefe, Bergnaum and Padberg',NULL,'480 Jason Lake',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(81,NULL,NULL,191,192,193,NULL,NULL,'odit fugit',NULL,'2027-04-23',NULL,NULL,'TX','illo reiciendis officiis',203,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 145, \"carrier\": \"ASI\", \"premium\": 120, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 5}','hill.johann@example.org','737.355.8224','Randi','Gleason',NULL,NULL,NULL,'Lon','Hettinger','79694 Schaefer Mountain Apt. 628','Lake Margarettaburgh','CA','90210','Dietrich, Kuhic and Schaefer',NULL,'54630 Rohan Station',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:10','2026-06-03 18:43:10',NULL),
(82,NULL,NULL,195,NULL,NULL,NULL,NULL,'modi et',NULL,'2026-11-19',NULL,NULL,'IL','adipisci molestiae quia',161,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rippin.aric@example.com','+1 (239) 870-1447','Fatima','Pollich',NULL,NULL,NULL,'Yasmeen','Herzog','2274 Rogelio Trace Suite 641','East Yazminhaven','CA','90210','Hermiston, Fadel and Runolfsson',NULL,'66625 Farrell Harbors',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11',NULL),
(83,NULL,NULL,196,NULL,NULL,NULL,NULL,'eum odio',NULL,'2027-02-04',NULL,NULL,'FL','maxime optio exercitationem',300,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','benny.nitzsche@example.com','+1.667.302.2875','Murl','Abbott',NULL,NULL,NULL,'Sophie','Haley','293 Gusikowski Green','Orrinstad','CA','90210','Wiza Group',NULL,'9115 Kunde Brooks Suite 853',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11',NULL),
(84,NULL,NULL,NULL,NULL,NULL,205,NULL,'saepe excepturi',NULL,'2027-04-17',NULL,NULL,'IL','autem possimus beatae',112,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','fidel.robel@example.net','+1.469.890.4366','Jovany','Shanahan',NULL,NULL,NULL,'Bradley','Pollich','465 Lafayette Plain','Samirtown','CA','90210','Kunze-Durgan',NULL,'1834 Maybelle Greens',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(85,NULL,NULL,NULL,NULL,NULL,205,NULL,'deserunt illum',NULL,'2027-04-13',NULL,NULL,'TX','vel distinctio non',166,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','gleason.luis@example.com','+14353566515','Abdul','Marquardt',NULL,NULL,NULL,'Willard','Hauck','106 Labadie Curve Suite 492','East Okey','CA','90210','Schuppe, Pollich and Crist',NULL,'86375 Glover Avenue Apt. 467',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(86,NULL,NULL,NULL,NULL,NULL,206,NULL,'sapiente sunt',NULL,'2026-07-24',NULL,NULL,'NY','commodi laudantium assumenda',166,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','mills.moshe@example.org','+1.832.525.6926','Stan','Mosciski',NULL,NULL,NULL,'Rasheed','Williamson','549 Batz Cape Suite 727','Parkerport','CA','90210','Gerlach, Bruen and Cassin',NULL,'34593 Moriah Lodge',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(87,NULL,NULL,NULL,NULL,NULL,207,NULL,'ea et',NULL,'2026-10-10',NULL,NULL,'CA','excepturi excepturi reiciendis',53,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','baron23@example.com','(703) 413-5281','Darby','Nader',NULL,NULL,NULL,'Chanelle','Schimmel','69419 Sheila Trail Apt. 471','Pfannerstillberg','CA','90210','Rempel-Jacobson',NULL,'44467 Hermiston Station',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(88,NULL,NULL,NULL,NULL,208,NULL,NULL,'tenetur et',NULL,'2027-01-27',NULL,NULL,'FL','modi est eum',123,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ubayer@example.org','650.965.4777','Joel','Stehr',NULL,NULL,NULL,'Fern','Hyatt','87899 Heller Turnpike Apt. 947','Conradburgh','CA','90210','Collier Group',NULL,'254 Senger Glen',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(89,NULL,NULL,NULL,NULL,210,NULL,NULL,'recusandae magni',NULL,'2026-09-10',NULL,NULL,'CA','et nostrum natus',143,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rick.bogisich@example.net','425.746.0666','Stewart','Denesik',NULL,NULL,NULL,'Antonette','Muller','7661 Keara Hill Apt. 683','Donnaside','CA','90210','Stehr LLC',NULL,'6605 Ruth Circle',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(90,NULL,NULL,NULL,NULL,NULL,211,NULL,'repellat illo',NULL,'2026-08-19',NULL,NULL,'IL','quibusdam doloremque pariatur',221,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','melba89@example.org','551.204.9545','Eugenia','Homenick',NULL,NULL,NULL,'Candace','Dickens','727 Oliver Lakes Suite 075','Kylashire','CA','90210','Kub Inc',NULL,'909 Duane Forest',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(91,NULL,NULL,NULL,NULL,NULL,211,NULL,'laborum nisi',NULL,'2026-07-18',NULL,NULL,'FL','ullam a ut',90,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','adrien.ward@example.org','+1.763.794.4978','Lamar','Walter',NULL,NULL,NULL,'Ashlynn','Baumbach','10532 Bridgette Cape Suite 043','Brockstad','CA','90210','Rosenbaum Inc',NULL,'82136 Gusikowski Station Suite 152',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(92,NULL,NULL,NULL,NULL,NULL,211,NULL,'rerum velit',NULL,'2026-07-23',NULL,NULL,'NY','corporis sit esse',22,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rosetta71@example.com','(682) 886-4580','Camila','Bernhard',NULL,NULL,NULL,'Delores','Ernser','7084 Sienna Place','Port Aniyastad','CA','90210','Ziemann-Bruen',NULL,'4474 Lura Crossroad',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(93,NULL,NULL,NULL,NULL,NULL,212,NULL,'veritatis quaerat',NULL,'2027-04-02',NULL,NULL,'TX','at blanditiis repudiandae',86,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','borer.lucy@example.com','838.725.8611','Melvin','Kub',NULL,NULL,NULL,'Bonnie','Doyle','407 Feil Radial Suite 503','New Deven','CA','90210','Swift-Cummings',NULL,'52372 Brycen Lake',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(94,NULL,NULL,NULL,NULL,NULL,212,NULL,'alias fugit',NULL,'2027-05-12',NULL,NULL,'FL','et incidunt error',253,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','lisette.brakus@example.net','937.220.0692','Ewell','McClure',NULL,NULL,NULL,'Kacey','Jacobi','3909 Johanna Mission Suite 431','South Polly','CA','90210','Bergstrom Inc',NULL,'69193 Grace Flats Suite 258',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'tried',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(95,NULL,NULL,NULL,NULL,NULL,212,NULL,'soluta laudantium',NULL,'2026-09-14',NULL,NULL,'TX','nam id consequatur',238,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','bobbie00@example.com','725-704-0804','Rae','Frami',NULL,NULL,NULL,'Patrick','Shields','9065 Lilian Camp Apt. 932','East Angelina','CA','90210','Miller Group',NULL,'6406 Collins Mill',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(96,NULL,NULL,NULL,NULL,NULL,213,NULL,'deleniti est',NULL,'2027-01-27',NULL,NULL,'NY','vel autem quisquam',276,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','alison52@example.net','+1.423.444.3803','Joanny','Kertzmann',NULL,NULL,NULL,'Kennedi','Zulauf','9857 Idella Brook Apt. 129','Parkerbury','CA','90210','Koepp, Turcotte and Murphy',NULL,'243 Stroman Meadow',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(97,NULL,NULL,NULL,NULL,NULL,215,NULL,'voluptatem labore',NULL,'2027-02-15',NULL,NULL,'FL','quo officia et',293,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','qbergnaum@example.net','+14635514997','Gus','Raynor',NULL,NULL,NULL,'Clement','Will','432 Koepp Trafficway','New Ludieton','CA','90210','Kshlerin, Glover and Spinka',NULL,'36599 Terrell Creek',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(98,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'reiciendis repudiandae',NULL,'2027-02-22',NULL,NULL,'FL','dolorem et praesentium',57,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','elsa53@example.org','+1.928.541.9028','Kareem','Olson',NULL,NULL,NULL,'Xzavier','Armstrong','62889 Macejkovic Lodge Apt. 484','North Ivatown','CA','90210','Legros-O\'Kon',NULL,'60082 Green Rue',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(99,NULL,NULL,NULL,NULL,NULL,217,NULL,'ut nostrum',NULL,'2026-11-01',NULL,NULL,'CA','et eligendi inventore',186,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','wjast@example.org','+1 (251) 928-2443','Bud','Murazik',NULL,NULL,NULL,'Gerardo','Marvin','57583 Erdman Key','East Noahbury','CA','90210','Stark, Hintz and Pfeffer',NULL,'335 Greenfelder Flat',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:12','2026-06-03 18:43:12',NULL),
(100,NULL,NULL,NULL,NULL,NULL,218,NULL,'placeat natus',NULL,'2027-05-07',NULL,NULL,'FL','assumenda et aliquam',227,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','myundt@example.net','1-361-429-6776','Adrien','Corkery',NULL,NULL,NULL,'Clark','Anderson','676 Stehr Walks Suite 869','Lake Dexterfurt','CA','90210','O\'Hara and Sons',NULL,'71712 Alvina Ferry Suite 654',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,'cois/filled_claims/cust-coi.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(101,NULL,NULL,NULL,NULL,NULL,220,NULL,'rerum et',NULL,'2026-07-19',NULL,NULL,'NY','veritatis iure natus',61,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kimberly49@example.net','(484) 732-2171','Kevon','Jakubowski',NULL,NULL,NULL,'Sophie','Okuneva','78778 Abbie Ridges Suite 035','Bridgetteton','CA','90210','Collier, Bayer and Koss',NULL,'2490 Borer Station',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(102,NULL,NULL,NULL,NULL,NULL,221,NULL,'ut in',NULL,'2026-09-13',NULL,NULL,'TX','aspernatur nisi omnis',47,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','louvenia.thiel@example.com','952.667.5857','Stephanie','Watsica',NULL,NULL,NULL,'Austyn','Trantow','8488 Hettinger Freeway Apt. 672','Zackerybury','CA','90210','Nikolaus, Bogisich and Cruickshank',NULL,'719 Noemi Crossing',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(103,NULL,NULL,NULL,NULL,NULL,222,NULL,'voluptatum et',NULL,'2027-04-07',NULL,NULL,'NY','quibusdam autem sapiente',299,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','cfranecki@example.org','+18635274919','Ben','Stokes',NULL,NULL,NULL,'Dillan','Zulauf','13615 Deion Glens','Konopelskimouth','CA','90210','Schimmel-Conn',NULL,'26879 Pouros Fields Apt. 651',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(104,NULL,NULL,NULL,NULL,NULL,223,NULL,'veniam ut',NULL,'2026-10-25',NULL,NULL,'IL','natus voluptas minus',236,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','schultz.jody@example.net','1-970-854-4411','Issac','Hammes',NULL,NULL,NULL,'Tina','Lubowitz','48480 Cristobal Land','Labadieview','CA','90210','Feest-Monahan',NULL,'830 Josephine Course',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(105,NULL,NULL,NULL,NULL,NULL,225,NULL,'at molestiae',NULL,'2026-12-18',NULL,NULL,'FL','tempora et suscipit',147,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','simeon.dickinson@example.org','727-440-9332','Alejandra','Stanton',NULL,NULL,NULL,'Elda','Murray','6819 Klein Dale','Prosaccofort','CA','90210','Beatty, Robel and Gusikowski',NULL,'9674 Bonnie Place',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(106,NULL,NULL,NULL,NULL,228,NULL,NULL,'nihil omnis',NULL,'2027-04-06',NULL,NULL,'FL','et aliquid porro',241,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ratke.kaela@example.net','254.645.0013','Robin','Dach',NULL,NULL,NULL,'Erna','Reichert','64324 Jessika Harbor Suite 502','Anitaburgh','CA','90210','Morissette LLC',NULL,'98773 Ankunding Square Suite 918',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(107,NULL,NULL,NULL,NULL,228,NULL,NULL,'nesciunt libero',NULL,'2027-03-07',NULL,NULL,'TX','accusantium sunt tempore',255,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','zdach@example.com','+1.812.938.6088','Kaela','DuBuque',NULL,NULL,NULL,'Jeremie','Satterfield','258 Ettie Lodge','East Juana','CA','90210','Lakin-Gutmann',NULL,'874 Cartwright Court Apt. 521',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(108,NULL,NULL,NULL,NULL,228,NULL,NULL,'sint voluptatibus',NULL,'2027-02-25',NULL,NULL,'NY','at qui cumque',162,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','wendy70@example.net','+18054212717','Savannah','Turcotte',NULL,NULL,NULL,'Holly','Pacocha','203 Otha Coves','West Lucie','CA','90210','Homenick-Wilkinson',NULL,'650 Delphine Glens',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'tried',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(109,NULL,NULL,NULL,NULL,229,NULL,NULL,'nostrum nemo',NULL,'2027-02-24',NULL,NULL,'CA','autem voluptas iusto',54,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','sincere32@example.com','1-417-466-8738','Aryanna','Schultz',NULL,NULL,NULL,'Rory','Wehner','2841 Harrison Glens','Raynortown','CA','90210','Lueilwitz PLC',NULL,'7986 Nader Pine',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(110,NULL,NULL,NULL,NULL,231,NULL,NULL,'saepe accusamus',NULL,'2027-03-13',NULL,NULL,'NY','vero asperiores ad',101,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ludwig57@example.com','1-930-499-7997','Elbert','Anderson',NULL,NULL,NULL,'Genesis','Botsford','6721 Kuhlman Plains','Tyraport','CA','90210','West, Aufderhar and Pfeffer',NULL,'645 Strosin Islands Apt. 841',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(111,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'animi ut',NULL,'2026-10-03',NULL,NULL,'NY','vel tenetur ab',34,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','michelle.cremin@example.net','731.326.9519','Jerrell','Marvin',NULL,NULL,NULL,'Dale','Streich','864 Reilly Inlet Suite 984','Port Karen','CA','90210','Marquardt-Friesen',NULL,'8364 Otho Street Apt. 868',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(112,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mollitia quia',NULL,'2026-10-23',NULL,NULL,'NY','vel quis cum',109,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','okuneva.verdie@example.net','920-983-0179','Benny','Lesch',NULL,NULL,NULL,'Leanne','Bradtke','10598 Idella Corner Suite 981','East Marisolmouth','CA','90210','Feest, Leuschke and Schmidt',NULL,'305 Danika Ford Suite 938',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(113,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'consequatur repudiandae',NULL,'2027-01-22',NULL,NULL,'FL','debitis qui voluptatibus',296,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','theo46@example.net','571.684.1116','Gilda','Sipes',NULL,NULL,NULL,'Beulah','Mueller','2771 Beier Ville Apt. 600','North Terrance','CA','90210','McKenzie, Cole and Reichert',NULL,'219 Quincy Stravenue Apt. 213',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(114,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'odio saepe',NULL,'2027-05-27',NULL,NULL,'IL','itaque facilis est',119,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ikovacek@example.org','+16035775141','Lorenz','DuBuque',NULL,NULL,NULL,'Roslyn','Beier','827 Erling Fields','Cronafort','CA','90210','Hauck, Schultz and Rath',NULL,'90817 Rosalee Forges Suite 298',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:13','2026-06-03 18:43:13',NULL),
(115,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dolorem voluptatibus',NULL,'2026-08-24',NULL,NULL,'CA','a cumque officia',237,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','insured@example.com','+1-925-356-9143','Frederik','Thompson',NULL,NULL,NULL,'Milford','Dooley','259 Heidi Overpass','North Larryside','CA','90210','Schuster, Shields and Bernier',NULL,'45104 Breitenberg Shoals',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(116,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'quae amet',NULL,'2026-09-28',NULL,NULL,'TX','in esse ut',122,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','reinger.stanton@example.net','+1-573-819-2271','Luz','Wilderman',NULL,NULL,NULL,'Coy','Cronin','3544 Hermina Knoll','West Easter','CA','90210','Marks Group',NULL,'3976 Bertram Lane Apt. 455',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(117,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'voluptatem aut',NULL,'2027-05-17',NULL,NULL,'FL','quia quam recusandae',58,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','wstanton@example.com','+1.984.538.9557','Justina','Howe',NULL,NULL,NULL,'Lavina','Schuppe','14709 Oberbrunner Courts Apt. 150','Parisianton','CA','90210','Rath-Schoen',NULL,'6074 Orn Groves Apt. 689',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(118,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ad quisquam',NULL,'2026-11-14',NULL,NULL,'TX','adipisci qui velit',272,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rsporer@example.org','937.826.4197','Herta','Brakus',NULL,NULL,NULL,'Willa','Altenwerth','5201 Golden Track Apt. 064','Clemmiechester','CA','90210','Dicki-Ritchie',NULL,'4957 Herman Passage Suite 266',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(119,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'neque maxime',NULL,'2026-12-04',NULL,NULL,'FL','velit reiciendis consectetur',295,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','candido.gusikowski@example.org','786-775-6137','Lia','Walter',NULL,NULL,NULL,'Sylvan','Brakus','7305 Jacobson Prairie Apt. 466','Rodriguezfort','CA','90210','Rau-Kuphal',NULL,'61640 Samir Bridge',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(120,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nulla voluptatibus',NULL,'2027-04-25',NULL,NULL,'NY','magni dolore eos',179,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','pmurazik@example.com','+1.317.538.7046','Stephan','Ferry',NULL,NULL,NULL,'Armand','Lebsack','174 Jerad Trail Apt. 902','Aleenshire','CA','90210','Schneider, Farrell and Bahringer',NULL,'437 Zboncak Parks',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(121,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'possimus illum',NULL,'2026-12-02',NULL,NULL,'NY','eum quidem sint',227,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','leannon.antwan@example.org','774.602.9662','Adah','Schmeler',NULL,NULL,NULL,'Wilma','Hill','4200 Karolann Pine Suite 715','Tessside','CA','90210','Keeling, Cruickshank and Goldner',NULL,'22572 Lulu Avenue Apt. 580',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(122,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'unde repellat',NULL,'2026-09-08',NULL,NULL,'CA','numquam est numquam',51,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','nstracke@example.net','678-495-7223','Beth','Kassulke',NULL,NULL,NULL,'Deontae','Pacocha','3733 Corkery Isle','Halvorsonside','CA','90210','Howell-Reynolds',NULL,'364 Ferry Mills',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(123,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nobis deleniti',NULL,'2027-05-15',NULL,NULL,'NY','pariatur sequi debitis',133,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','bauch.verlie@example.com','1-848-314-0612','Lisette','Dare',NULL,NULL,NULL,'Patrick','Gottlieb','8020 Ullrich Points Suite 928','Ortizmouth','CA','90210','Haag, Goyette and Kihn',NULL,'83757 Bechtelar Village Apt. 804',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14',NULL),
(124,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'sint ea',NULL,'2027-03-24',NULL,NULL,'FL','beatae quaerat tempore',221,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','thelma49@example.com','+1-309-814-4266','Genoveva','Wehner',NULL,NULL,NULL,'Wilford','Harvey','5139 Sauer Trail Suite 143','Lake Bill','CA','90210','Veum-Kreiger',NULL,'7920 Bobby Manor Suite 770',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(125,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'qui omnis',NULL,'2027-01-22',NULL,NULL,'NY','fugiat est et',59,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','nikki.maggio@example.com','+1-820-727-2953','Laverne','Marks',NULL,NULL,NULL,'Nakia','Raynor','80365 Wisoky Ridge','East Maidaton','CA','90210','Wyman Ltd',NULL,'5889 Lebsack Court',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(126,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'quia possimus',NULL,'2027-05-04',NULL,NULL,'IL','aperiam tempore voluptates',109,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','loraine39@example.net','+1-678-441-5297','Catalina','Connelly',NULL,NULL,NULL,'Judd','Marks','8366 Pablo Points','Darylfort','CA','90210','Lind Inc',NULL,'92585 Lia Knolls Apt. 726',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(127,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ut aut',NULL,'2026-12-15',NULL,NULL,'NY','quia nam repellat',165,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kathryn38@example.net','478.232.6316','Zoie','Crist',NULL,NULL,NULL,'Virginia','Quigley','9772 D\'Amore Cape Apt. 041','Haleighfurt','CA','90210','Pollich Ltd',NULL,'957 Konopelski Bypass Suite 862',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(128,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'deserunt necessitatibus',NULL,'2027-05-16',NULL,NULL,'IL','eos rerum ut',177,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kaelyn.cassin@example.org','858-599-3191','Daphnee','Vandervort',NULL,NULL,NULL,'Hester','White','757 Harris Coves Suite 379','West Keara','CA','90210','Yost-Cronin',NULL,'61617 Vicky Cliffs Apt. 902',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(129,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'delectus minima',NULL,'2026-10-27',NULL,NULL,'TX','et qui cupiditate',298,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','uyundt@example.org','463-507-2256','Kayley','Spinka',NULL,NULL,NULL,'Nicolas','Bosco','560 Itzel Wall','Carrollview','CA','90210','Weimann, Auer and Rodriguez',NULL,'3090 Hartmann Divide Suite 531',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(130,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'totam dolore',NULL,'2027-04-29',NULL,NULL,'CA','delectus est aliquam',78,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','eli31@example.net','+1 (770) 893-0545','Genoveva','Hyatt',NULL,NULL,NULL,'Walton','Wisoky','2446 Hansen Trafficway Apt. 916','West Ellsworth','CA','90210','Hoeger and Sons',NULL,'13922 Kerluke Way Suite 175',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(131,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ut excepturi',NULL,'2027-02-07',NULL,NULL,'NY','ut animi aut',288,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','neoma.dickinson@example.org','808.288.9814','Keegan','Dietrich',NULL,NULL,NULL,'Carmelo','Hermiston','7046 Shawn Islands','Robelshire','CA','90210','Treutel, Murazik and McGlynn',NULL,'887 O\'Hara Park Apt. 326',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(132,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'vel numquam',NULL,'2027-02-06',NULL,NULL,'NY','et iusto et',56,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','mariela78@example.com','+16207144719','Guadalupe','Kuhlman',NULL,NULL,NULL,'Kennedi','Jenkins','64597 Frederique Squares','Lexusfort','CA','90210','Zieme PLC',NULL,'209 Gutkowski Harbors',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(133,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'temporibus quae',NULL,'2027-02-08',NULL,NULL,'TX','tenetur maiores autem',106,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','charley.rippin@example.net','1-951-829-2466','Daron','Gaylord',NULL,NULL,NULL,'Rory','Osinski','84065 Telly Knoll','East Daisha','CA','90210','Armstrong Ltd',NULL,'58400 Bernier Valley',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(134,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'veniam aut',NULL,'2026-11-09',NULL,NULL,'NY','aspernatur vel vel',180,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','frida.kuhn@example.net','1-828-565-2391','Dan','Johns',NULL,NULL,NULL,'Dillan','Barton','7534 Ubaldo Highway Apt. 621','South Evie','CA','90210','Cronin-Sawayn',NULL,'7330 Kyra Heights',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(135,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'perferendis dolorem',NULL,'2027-04-13',NULL,NULL,'NY','quo in tenetur',126,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','sonia61@example.com','352.983.0385','Vivienne','Jacobi',NULL,NULL,NULL,'Vida','Kessler','39405 Rogers Ford Suite 015','East Andreanneport','CA','90210','Hartmann Inc',NULL,'27542 Jacklyn Corners',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(136,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'impedit necessitatibus',NULL,'2026-11-24',NULL,NULL,'CA','ab velit porro',221,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','cjacobs@example.net','(617) 558-9982','Alexandrea','Dickens',NULL,NULL,NULL,'Talon','Halvorson','824 Chet Cliff Apt. 679','Port Othomouth','CA','90210','Boyer-Smitham',NULL,'116 Twila Underpass Suite 690',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:15','2026-06-03 18:43:15',NULL),
(137,NULL,NULL,NULL,NULL,NULL,NULL,2,'Birthday Party',NULL,'2031-06-18',NULL,NULL,'CA',NULL,120,0,0,NULL,'none',NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,1,0,'0',NULL,NULL,'jane@example.com','5551234567','Jane','Doe',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'mq',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(138,NULL,NULL,NULL,NULL,NULL,NULL,3,'Birthday Party',NULL,'2031-06-18',NULL,NULL,'CA',NULL,120,0,0,NULL,'none',NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,1,0,'0',NULL,NULL,'jane@example.com','5551234567','Jane','Doe',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'mq',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(139,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ut tenetur',NULL,'2027-04-12',NULL,NULL,'CA','amet error quia',122,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rodriguez.sasha@example.org','+1 (218) 705-5335','Kaela','O\'Hara',NULL,NULL,NULL,'Tavares','Howell','57667 Borer Mews Suite 481','East Brisa','CA','90210','Bogan-Ratke',NULL,'1192 Rebekah Turnpike',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(140,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'qui quia',NULL,'2026-12-31',NULL,NULL,'FL','velit unde maiores',243,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','luettgen.verona@example.net','+1-636-719-4248','Noelia','Grady',NULL,NULL,NULL,'Godfrey','Rosenbaum','889 Ceasar Branch','Lake Quintenton','CA','90210','McDermott, Bradtke and Mraz',NULL,'6602 Khalil Spur',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(141,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'perspiciatis architecto',NULL,'2026-09-03',NULL,NULL,'TX','eaque tenetur praesentium',248,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','phoebe78@example.net','+1-762-701-0933','Abigail','Douglas',NULL,NULL,NULL,'Carolina','Stark','75808 Hane Underpass','South Jalyn','CA','90210','Runolfsson-Ruecker',NULL,'59691 Wilkinson Harbor Suite 958',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(142,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dolorum et',NULL,'2027-01-05',NULL,NULL,'FL','magnam id esse',188,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','berge.alycia@example.com','+1 (469) 418-5470','Jaylin','Rippin',NULL,NULL,NULL,'Steve','Beatty','7299 Schowalter Coves','West Wernermouth','CA','90210','McCullough, Lemke and Lynch',NULL,'879 Ortiz Creek',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,'policies/34.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(143,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'tempora ut',NULL,'2026-09-05',NULL,NULL,'NY','vitae animi dolorem',55,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ndooley@example.org','+1-605-316-4917','Destiney','Dicki',NULL,NULL,NULL,'Ursula','Windler','585 Lesch Mountains Apt. 563','Tillmanberg','CA','90210','Herman-Monahan',NULL,'375 Otto Circles',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(144,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'id neque',NULL,'2026-09-23',NULL,NULL,'NY','officiis nam dolore',226,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','collier.jevon@example.org','+1 (640) 526-2871','Aileen','Bartell',NULL,NULL,NULL,'Taryn','Jaskolski','6971 Graham Stravenue','Champlinberg','CA','90210','Dickinson, Carter and Beahan',NULL,'766 Hills Court Suite 481',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(145,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'velit aspernatur',NULL,'2027-01-24',NULL,NULL,'NY','quo dolores ut',184,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','angelica10@example.org','218.494.9761','Anais','O\'Conner',NULL,NULL,NULL,'Therese','Collins','2396 Heloise Points','Deckowberg','CA','90210','Hane, Padberg and Boehm',NULL,'238 Runolfsson Streets Suite 438',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,'policies/1.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:16','2026-06-03 18:43:16',NULL),
(146,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'porro adipisci',NULL,'2026-12-03',NULL,NULL,'FL','tenetur deserunt architecto',262,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','nia31@example.org','+1.512.390.4350','Ena','Kuvalis',NULL,NULL,NULL,'Giovanny','Auer','822 Frida Fords','New Levi','CA','90210','Cartwright-Hegmann',NULL,'2292 Germaine Island Apt. 231',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(147,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'blanditiis quia',NULL,'2026-09-26',NULL,NULL,'NY','corporis eum officiis',95,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jschuster@example.org','231-505-7680','Judy','Emard',NULL,NULL,NULL,'Kacey','Cormier','150 Lakin Rest Suite 561','Jeanneport','CA','90210','Predovic and Sons',NULL,'49073 Hackett Drive Suite 389',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(148,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dolore doloremque',NULL,'2027-04-03',NULL,NULL,'FL','cupiditate debitis cum',98,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','dariana37@example.org','1-781-882-2905','Erika','Schmeler',NULL,NULL,NULL,'Jana','Paucek','71862 Floy Crescent','Wardborough','CA','90210','Stanton Inc',NULL,'315 Chanel Forks Suite 211',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,'policies/1.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(149,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'omnis qui',NULL,'2026-09-23',NULL,NULL,'TX','minus asperiores asperiores',46,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','justice.wolf@example.net','615-258-4260','Keon','Swift',NULL,NULL,NULL,'Geo','Cormier','59156 Mraz Mountain','East Nicholas','CA','90210','Hand-Kuhlman',NULL,'1993 Kelsi Forest',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,'policies/149.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(150,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'facilis sit',NULL,'2026-07-26',NULL,NULL,'FL','a unde est',98,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','sophie95@example.org','1-630-720-0303','Missouri','Greenholt',NULL,NULL,NULL,'Fredrick','Nitzsche','64117 Nikita Key Suite 717','West Bernardo','CA','90210','Langworth-Gaylord',NULL,'1003 Allison Rapid',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,'receipts/150-receipt.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(151,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'magni aliquid',NULL,'2026-07-18',NULL,NULL,'IL','corporis et officiis',167,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','awitting@example.com','301-271-2541','Johnpaul','Halvorson',NULL,NULL,NULL,'Adrian','Hammes','84042 Guiseppe Terrace','North Myah','CA','90210','Ryan-Hilpert',NULL,'42978 Schinner Union',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,'cois/filled_claims/151-coi.pdf',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(152,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'jbZh92p8UfX0fYHynMQ9nkDk1nlaOXNV',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":{\"params\":{\"event_type_id\":1,\"event_state\":\"CA\"},\"selectedPlan\":null,\"customerInfo\":[]}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(153,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'d8kMzT74R7tqLHzhQk24fSAcBW5tC6Xj',NULL,'{\"current_route\":\"\\/quote\\/plans\",\"wizard_state\":{\"params\":{\"event_type_id\":5},\"selectedPlan\":null}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(154,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,'Alice',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'nJwUX1nWkNU5ndwxaN2PxQ4J1eWVXoTe',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":{\"customerInfo\":{\"first_name\":\"Alice\"}}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(155,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'HIop8NZpTKo2cbC85R04Fcz9dgqv2Fta',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":{\"selectedPlan\":{\"carrier\":\"ASI\"}}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:17','2026-06-03 18:43:17',NULL),
(156,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'8DtSDBLezSKNWIPlZzyaR5S0bi9dBBwA',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":{\"params\":{\"event_type_id\":1,\"event_state\":\"CA\"},\"selectedPlan\":null,\"customerInfo\":[]}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(157,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'saepe ratione',NULL,'2027-05-11',NULL,NULL,'CA','similique et maxime',262,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','heath69@example.com','+1 (669) 556-4321','Mustafa','Hand',NULL,NULL,NULL,'Chelsea','Borer','773 Deondre Wells Apt. 299','West Kobyland','CA','90210','Batz-Borer',NULL,'31434 Satterfield Road',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,'completed_token_12345678901234',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(158,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'4OID5K3govSttU5LZ2T2pnu5Oo2lDB5y',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":{\"params\":{\"event_type_id\":1,\"event_state\":\"CA\"},\"selectedPlan\":null,\"customerInfo\":[]}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(159,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'5GtEAgCHcqctnQc2eMQPCYipJtbt3iu2',NULL,'{\"current_route\":\"\\/quote\\/plans\",\"wizard_state\":{\"params\":{\"event_state\":\"CA\"}}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(160,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0,0,NULL,NULL,NULL,'test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,0,'saved',1,NULL,NULL,NULL,NULL,'L4K6v0pJjslnCdUDrMD1ECvY7m66NwB4',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":{\"params\":{\"event_type_id\":1}}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(161,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'illum est',NULL,'2027-03-25',NULL,NULL,'NY','reprehenderit debitis sed',199,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','niko84@example.org','701.601.7558','Hollie','Boyle',NULL,NULL,NULL,'Eden','Hodkiewicz','129 Hansen Junction','South Lessie','CA','90210','Marquardt, Block and Larson',NULL,'44871 Koepp Fall Apt. 905',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,'paid_token_123456789012345678',NULL,'{\"current_route\":\"\\/quote\\/info\",\"wizard_state\":[]}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(162,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'non mollitia',NULL,'2027-01-06',NULL,NULL,'IL','facere temporibus sint',172,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','hassie.kunde@example.org','1-623-255-3179','Malcolm','Little',NULL,NULL,NULL,'Warren','Bartoletti','23327 Richmond Meadow','East Bethmouth','CA','90210','Kshlerin Inc',NULL,'18554 Ebert Mount',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'saved',1,NULL,NULL,NULL,NULL,'norouttoken12345678901234567',NULL,'{\"wizard_state\":{\"foo\":\"bar\"}}',NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(163,NULL,'REF-PLANNER',NULL,NULL,NULL,NULL,NULL,'qui saepe',NULL,'2026-10-07',NULL,NULL,'TX','vero reiciendis minus',132,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','barrows.lexie@example.net','+1-779-910-7634','Judge','Cormier',NULL,NULL,NULL,'Adella','Feest','3618 Veum Trace Suite 501','Imogenechester','CA','90210','Bergnaum, Yost and Flatley',NULL,'9228 Marvin Ville Suite 526',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(164,NULL,'REF-PLANNER',NULL,NULL,NULL,NULL,NULL,'quis tempora',NULL,'2026-08-16',NULL,NULL,'FL','id nisi et',138,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','reagan54@example.org','716.445.9963','Ilene','Casper',NULL,NULL,NULL,'Thalia','Mohr','3259 Pearl Key Apt. 105','East Lornahaven','CA','90210','Johnston-Morissette',NULL,'74754 Frederique Cliffs Suite 909',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(165,NULL,'REF-PLANNER',NULL,NULL,NULL,NULL,NULL,'enim veritatis',NULL,'2026-12-08',NULL,NULL,'NY','temporibus eius qui',129,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ole.cummings@example.com','1-267-567-2310','Edyth','Wilderman',NULL,NULL,NULL,'Franz','Waelchi','17421 Orn Overpass Apt. 038','Lake Evangeline','CA','90210','Batz, Langworth and Willms',NULL,'9814 Flatley Glen',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(166,NULL,'REF-OTHER',NULL,NULL,NULL,NULL,NULL,'eaque ut',NULL,'2027-02-12',NULL,NULL,'IL','consequatur asperiores iure',214,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','rodolfo03@example.com','(810) 326-9635','Fatima','Durgan',NULL,NULL,NULL,'Rachelle','Fadel','5480 Kennedi Centers','O\'Reillychester','CA','90210','Gorczany-Collins',NULL,'74756 Shanny Roads',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(167,NULL,'REF-OTHER',NULL,NULL,NULL,NULL,NULL,'tempora et',NULL,'2027-01-27',NULL,NULL,'IL','vel veniam qui',195,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','kaylie.welch@example.org','+1.650.965.8057','Francesco','Crona',NULL,NULL,NULL,'Richie','Treutel','790 Tillman Lane','Bahringerberg','CA','90210','Macejkovic Inc',NULL,'125 Sigrid Field',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:18','2026-06-03 18:43:18',NULL),
(168,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'natus magni',NULL,'2027-02-16',NULL,NULL,'FL','vitae porro porro',255,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','domenica.toy@example.org','972-657-3367','Vinnie','Murray',NULL,NULL,NULL,'Mia','Nader','1761 Schowalter Creek','West Lori','CA','90210','Dickens Group',NULL,'83234 Weimann Loaf Apt. 330',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(169,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'aut nemo',NULL,'2026-12-09',NULL,NULL,'IL','qui molestiae iste',241,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jenkins.mabelle@example.org','+1-828-217-1725','Queenie','Pfeffer',NULL,NULL,NULL,'Zackery','Beahan','25838 Green Mountain','New Bettie','CA','90210','Collier LLC',NULL,'3896 Elijah Loaf Apt. 504',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(170,NULL,'REF-LIST',NULL,NULL,NULL,NULL,NULL,'voluptas sit',NULL,'2027-03-06',NULL,NULL,'IL','qui debitis tempore',51,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','otto75@example.com','+13619223223','Sofia','Steuber',NULL,NULL,NULL,'Salvatore','Davis','82661 Larson Knolls Apt. 673','Crooksbury','CA','90210','Doyle Ltd',NULL,'1341 Daugherty Freeway Apt. 426',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(171,NULL,'REF-LIST',NULL,NULL,NULL,NULL,NULL,'voluptatem sit',NULL,'2027-05-09',NULL,NULL,'TX','ut odio dolorem',234,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','vsawayn@example.net','+1 (662) 849-3274','Concepcion','Nicolas',NULL,NULL,NULL,'Darrion','West','53847 Shanie Place','North Kristinashire','CA','90210','Romaguera LLC',NULL,'898 Dickinson Track Apt. 633',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(172,NULL,'REF-LIST',NULL,NULL,NULL,NULL,NULL,'vel blanditiis',NULL,'2026-10-19',NULL,NULL,'CA','rerum ad nulla',175,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','carolina06@example.org','(406) 286-6164','Elda','Baumbach',NULL,NULL,NULL,'Larue','Kuhlman','61312 Ola Knoll Suite 384','East Janet','CA','90210','Runte-Lakin',NULL,'3951 Senger Mall',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(173,NULL,'REF-LIST',NULL,NULL,NULL,NULL,NULL,'eos nostrum',NULL,'2026-10-03',NULL,NULL,'NY','quia facilis nulla',165,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','zackary70@example.com','+1 (424) 591-0712','Julie','Cassin',NULL,NULL,NULL,'Aglae','Osinski','68282 Madyson View','South Koby','CA','90210','Dooley-Pollich',NULL,'92867 Medhurst Pines Apt. 151',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(174,NULL,'REF-MINE',NULL,NULL,NULL,NULL,NULL,'fugit perspiciatis',NULL,'2026-10-07',NULL,NULL,'FL','corrupti est dolorem',174,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','fschamberger@example.com','1-440-392-3485','Buck','Hayes',NULL,NULL,NULL,'Abby','Schaefer','80951 Durgan Divide','South Hadleyville','CA','90210','Douglas, Harvey and Larkin',NULL,'25407 Beer Meadows',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(175,NULL,'REF-THEIRS',NULL,NULL,NULL,NULL,NULL,'vel eos',NULL,'2026-11-29',NULL,NULL,'IL','quaerat magni quod',13,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','jones.hayden@example.com','(816) 416-1304','Adrain','Huels',NULL,NULL,NULL,'Jonathon','Sanford','494 Crist Bypass Suite 324','North Josue','CA','90210','Stanton Group',NULL,'56126 Abshire Circles Suite 096',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(176,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'quo ipsam',NULL,'2026-07-27',NULL,NULL,'CA','quis nisi non',128,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','harold.reichel@example.net','608-495-9369','Dena','Morissette',NULL,NULL,NULL,'Brennan','Aufderhar','78668 Alena Mills','Feestchester','CA','90210','Kirlin, Boyle and Schuppe',NULL,'99966 Justyn Orchard Apt. 787',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(177,NULL,'REF-FLT',NULL,NULL,NULL,NULL,NULL,'eligendi totam',NULL,'2026-12-09',NULL,NULL,'IL','ut inventore dolorum',132,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','wbatz@example.com','570-637-1684','Forrest','Kiehn',NULL,NULL,NULL,'Christa','Fahey','863 Gutkowski Manors','New Elviestad','CA','90210','Schaefer Group',NULL,'528 Mara Square Suite 508',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(178,NULL,'REF-FLT',NULL,NULL,NULL,NULL,NULL,'quidem vitae',NULL,'2027-03-20',NULL,NULL,'FL','aut natus in',77,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','theresia47@example.com','+1-332-423-0521','Eva','Wehner',NULL,NULL,NULL,'Eladio','Brown','87301 Boyle Bridge','West Leland','CA','90210','Quitzon LLC',NULL,'518 Reinger Divide Apt. 001',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'tried',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(179,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'voluptas nihil',NULL,'2026-10-25',NULL,NULL,'IL','provident quasi nisi',231,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','chester79@example.com','479.984.0855','Demetrius','Fritsch',NULL,NULL,NULL,'Nestor','Kuhn','739 Diamond Forges','East Julioville','CA','90210','Barton, Abbott and Paucek',NULL,'89416 Mark Shoal Suite 442',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(180,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'suscipit sed',NULL,'2026-12-17',NULL,NULL,'CA','reprehenderit laboriosam eum',147,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'ASI','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','cruickshank.godfrey@example.net','901.570.7654','Jarrett','Hermann',NULL,NULL,NULL,'Heidi','Schmeler','119 Auer Branch Suite 150','Port Liamberg','CA','90210','Krajcik-Davis',NULL,'597 Murray Drive',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(181,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'officiis voluptatem',NULL,'2027-01-11',NULL,NULL,'FL','debitis fugiat facere',160,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','adaline71@example.com','(743) 667-8073','Lilliana','Rodriguez',NULL,NULL,NULL,'Nora','Cassin','56755 Turcotte Crossing Apt. 112','Lake Samara','CA','90210','Kihn, Turner and Kihn',NULL,'766 Little Island Apt. 090',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:19','2026-06-03 18:43:19',NULL),
(182,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'rerum fugiat',NULL,'2027-03-14',NULL,NULL,'TX','aut laboriosam id',115,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ehalvorson@example.org','+1 (726) 279-8890','Anita','Rodriguez',NULL,NULL,NULL,'Gerry','Carter','57573 Wiza Summit','South Joanaview','CA','90210','Champlin, Lynch and Johnson',NULL,'937 Veda Knoll',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22',NULL),
(183,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'molestiae nam',NULL,'2026-11-25',NULL,NULL,'FL','maiores in doloribus',31,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','ggibson@example.com','206.588.3135','Zaria','Hammes',NULL,NULL,NULL,'Mervin','Mertz','25622 Windler Lock Apt. 757','Lake Yolanda','CA','90210','Muller, Satterfield and Sipes',NULL,'281 Reichert Pines',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22',NULL),
(184,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'unde maiores',NULL,'2026-12-27',NULL,NULL,'IL','deserunt molestiae assumenda',238,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'IH','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','zulauf.vilma@example.org','949-663-8841','Mathilde','Walker',NULL,NULL,NULL,'Sydnee','Purdy','42963 Kathleen Extension Apt. 222','Francoberg','CA','90210','Jenkins Inc',NULL,'946 Howe Mountain Apt. 785',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22',NULL),
(185,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'totam aut',NULL,'2026-12-28',NULL,NULL,'FL','repudiandae est consequatur',196,0,0,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0,0,0,NULL,NULL,'FDEAN','1/2',0,0,0,NULL,NULL,'{\"total\": 98.33, \"carrier\": \"ASI\", \"premium\": 75, \"rate_id\": 1, \"max_limit\": 2, \"min_limit\": 1, \"broker_fee\": 20, \"extra_charge\": 0, \"processing_fee\": 3.33}','pjacobson@example.com','1-307-492-2973','Gabrielle','Simonis',NULL,NULL,NULL,'Oliver','Bailey','860 Adams Fort','New Braulio','CA','90210','Kiehn-Jakubowski',NULL,'80751 Cynthia Way',NULL,'CA','90210',NULL,NULL,0,NULL,NULL,NULL,NULL,1,0,'payment_received',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,0,0,NULL,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22',NULL);

/*Table structure for table `migrations` */

DROP TABLE IF EXISTS `migrations`;

CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `migrations` */

insert  into `migrations`(`id`,`migration`,`batch`) values 
(1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2026_04_14_043727_create_personal_access_tokens_table',1),
(5,'2026_04_14_110001_create_event_types_table',1),
(6,'2026_04_14_110002_create_event_rates_table',1),
(7,'2026_04_14_110003_create_event_rate_states_table',1),
(8,'2026_04_14_110004_create_us_states_table',1),
(9,'2026_04_14_110005_create_leads_table',1),
(10,'2026_04_14_110006_create_sales_table',1),
(11,'2026_04_14_110007_create_received_payments_table',1),
(12,'2026_04_14_110008_create_user_payments_table',1),
(13,'2026_04_14_110009_create_lead_notes_table',1),
(14,'2026_04_14_110010_create_lead_emails_table',1),
(15,'2026_04_14_110011_create_lead_files_table',1),
(16,'2026_04_14_110012_create_lead_follow_ups_table',1),
(17,'2026_04_14_110013_create_lead_actions_table',1),
(18,'2026_04_14_110014_create_lead_assignment_table',1),
(19,'2026_04_14_110015_create_lead_changes_table',1),
(20,'2026_04_14_110016_create_carrier_gl_limits_table',1),
(21,'2026_04_14_110017_create_invoices_table',1),
(22,'2026_04_14_110018_create_invoice_line_items_table',1),
(23,'2026_04_14_110019_create_invoice_coverage_lines_table',1),
(24,'2026_04_14_110020_create_invoice_templates_table',1),
(25,'2026_04_14_110021_create_invoice_sender_profiles_table',1),
(26,'2026_04_14_110022_create_blogs_table',1),
(27,'2026_04_14_110023_create_pages_table',1),
(28,'2026_04_23_092441_create_commissions_table',1),
(29,'2026_04_23_092455_add_commission_fields_to_users_table',1),
(30,'2026_04_23_092457_add_referral_ids_to_leads_table',1),
(31,'2026_04_23_093834_create_w9_uploads_table',1),
(32,'2026_04_23_120001_create_email_templates_table',1),
(33,'2026_04_23_120002_add_email_sent_flags_to_leads_table',1),
(34,'2026_04_23_120003_add_reminder_sent_at_to_lead_follow_ups_table',1),
(35,'2026_04_24_120001_create_contact_submissions_table',1),
(36,'2026_04_24_120002_create_subscribers_table',1),
(37,'2026_04_24_130001_create_doc_sign_statuses_table',1),
(38,'2026_04_24_140001_add_pdf_paths_to_leads_table',1),
(39,'2026_05_01_000001_add_action_type_meta_to_lead_actions',1),
(40,'2026_05_19_000001_add_additional_insured_details_to_leads',1),
(41,'2026_06_03_000001_create_lead_messages_table',2),
(42,'2026_06_04_000001_add_chat_moderation_fields',2);

/*Table structure for table `pages` */

DROP TABLE IF EXISTS `pages`;

CREATE TABLE `pages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `navbar_text` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_keywords` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_page_id` bigint unsigned DEFAULT NULL,
  `editor_content` text COLLATE utf8mb4_unicode_ci,
  `header_content` text COLLATE utf8mb4_unicode_ci,
  `content_title` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banner_image` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_image` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tips_heading` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tip1_text` text COLLATE utf8mb4_unicode_ci,
  `tip2_text` text COLLATE utf8mb4_unicode_ci,
  `tip3_text` text COLLATE utf8mb4_unicode_ci,
  `tip1_image` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tip2_image` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tip3_image` varchar(155) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type_id` bigint unsigned DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `add_to_menu` tinyint(1) NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_slug_unique` (`slug`),
  KEY `pages_event_type_id_foreign` (`event_type_id`),
  KEY `pages_status_index` (`status`),
  KEY `pages_add_to_menu_index` (`add_to_menu`),
  KEY `pages_parent_page_id_foreign` (`parent_page_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `pages` */

insert  into `pages`(`id`,`title`,`slug`,`navbar_text`,`meta_keywords`,`meta_description`,`parent_page_id`,`editor_content`,`header_content`,`content_title`,`banner_image`,`content_image`,`tips_heading`,`tip1_text`,`tip2_text`,`tip3_text`,`tip1_image`,`tip2_image`,`tip3_image`,`event_type_id`,`sort_order`,`add_to_menu`,`status`,`created_at`,`updated_at`) values 
(1,'Repellat Corrupti Sint','repellat-corrupti-sint','asperiores voluptatem','quis iure et ut','Non excepturi perspiciatis corrupti non qui.',NULL,'<p>Amet molestias culpa temporibus et. Dicta eum ex mollitia debitis nostrum molestiae. Qui numquam ea et deserunt nostrum qui. Dolorum neque cum dolor aspernatur.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,56,0,1,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(2,'Aut Debitis Ullam','aut-debitis-ullam','molestiae natus','corrupti fuga natus et','Eum repudiandae sint voluptate.',NULL,'<p>Expedita accusamus a nesciunt qui dignissimos earum. Enim et consequatur sunt non. Ut ab accusantium pariatur vero voluptates voluptatem consequatur. Harum laboriosam quis quasi molestiae placeat natus optio.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,89,0,1,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(3,'Aut Ea Aut','aut-ea-aut','id est','consectetur enim est enim','Officiis occaecati amet omnis dolorem et aut doloribus.',NULL,'<p>Aperiam porro et accusamus similique. Pariatur porro cumque rerum voluptatem quam. Magnam maiores asperiores id dolorem velit magni dignissimos.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,11,0,1,'2026-06-03 18:43:02','2026-06-03 18:43:02'),
(4,'About Us','about-us','quos voluptatibus','iure maiores aut ea','Accusamus officia voluptatem nam est.',NULL,'<p>Quae officiis sapiente quia neque est et. Corporis sequi qui cumque id nisi. Voluptas est autem voluptas earum accusamus. Corrupti ducimus qui eaque.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,22,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(5,'Vero Excepturi A','vero-excepturi-a','totam distinctio','rerum voluptatem ipsam blanditiis','Molestiae facilis consequuntur maxime earum.',NULL,'<p>Consequuntur voluptates cum repellendus est ipsum. Reprehenderit ad dolorum corrupti voluptates perferendis ducimus sit dignissimos. Vel voluptatem accusantium voluptatem.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(6,'Fuga Explicabo Alias','fuga-explicabo-alias','ab explicabo','odit voluptate placeat enim','Deleniti ullam earum rem cupiditate numquam at commodi fuga.',NULL,'<p>Vel eius cupiditate omnis nisi. Facere quia velit quas possimus. Voluptatem voluptas error hic nemo ut veritatis aut. Accusantium voluptatum ut rem eius ullam nobis voluptatibus. Autem voluptas delectus eos laboriosam consectetur hic voluptate.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,53,0,0,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(7,'New Title','quia-non-qui','nostrum numquam','qui consectetur sed voluptatum','Atque natus enim rerum ducimus sint vel.',NULL,'<p>Voluptatem et et quis nulla modi. Corrupti dolorem iure dolorem. Reiciendis officia hic aut nemo in. Excepturi suscipit vel et odio cum.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,21,0,0,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(8,'Ut Dicta Maiores','page-a','culpa excepturi','harum optio nihil blanditiis','Magnam sit dolor reiciendis nisi sint molestiae quaerat.',NULL,'<p>Nemo assumenda facere praesentium quia ea. Quo harum quis animi magnam qui voluptatem et.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,19,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(9,'Quia Animi Itaque','page-b','et dignissimos','laboriosam sed sequi qui','Similique quod nam iusto numquam rerum quam.',NULL,'<p>Molestiae veritatis ut saepe nobis est. Omnis doloribus et sed odio corporis. Ipsum corporis eum voluptate eos autem autem.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,8,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(10,'Quae Quisquam Sint','my-page','officiis eum','ut suscipit id saepe','Commodi laudantium odit officiis omnis beatae cum.',NULL,'<p>Tempore voluptates aliquam natus ab fugit ut. Eveniet id sequi et. Temporibus quaerat odit autem voluptatibus accusantium ex ut placeat. Quia ipsa voluptas dicta quos.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,96,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(12,'Possimus Quia Corrupti','possimus-quia-corrupti','cumque fugit','voluptatem voluptatum qui incidunt','Doloremque aut amet error et deleniti unde molestias quia.',NULL,'<p>Fugiat quidem velit velit. Aut consectetur earum molestiae neque hic. Enim necessitatibus qui quidem repellat explicabo quo consequatur.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03'),
(13,'Et Modi Perspiciatis','et-modi-perspiciatis','debitis mollitia','modi molestiae sed ex','Qui incidunt corporis ea repellendus corrupti fugiat ut tenetur.',NULL,'<p>Quod ut doloribus voluptatum rerum. Consequatur et consequatur quod.</p>',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,0,1,'2026-06-03 18:43:03','2026-06-03 18:43:03');

/*Table structure for table `password_reset_tokens` */

DROP TABLE IF EXISTS `password_reset_tokens`;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `password_reset_tokens` */

/*Table structure for table `personal_access_tokens` */

DROP TABLE IF EXISTS `personal_access_tokens`;

CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `personal_access_tokens` */

insert  into `personal_access_tokens`(`id`,`tokenable_type`,`tokenable_id`,`name`,`token`,`abilities`,`last_used_at`,`expires_at`,`created_at`,`updated_at`) values 
(1,'App\\Models\\User',239,'impersonation','6f249f9a85e00965d75e354b6e3fcce7d0d75a79db1e53194c0e5fda91ef2176','[\"impersonated\"]',NULL,NULL,'2026-06-03 18:43:14','2026-06-03 18:43:14'),
(5,'App\\Models\\User',363,'auth_token','ca2ce06e43dc9880eb99b599dc90037248668036570030246a6e5b228977b58e','[\"*\"]',NULL,NULL,'2026-06-03 19:35:43','2026-06-03 19:35:43'),
(11,'App\\Models\\User',241,'auth_token','0aacd8a83a70c3993845cf4dc9a58abaae9c9c545648b00bd1f2a02d3b5c0c92','[\"*\"]',NULL,NULL,'2026-06-11 06:11:20','2026-06-11 06:11:20'),
(7,'App\\Models\\User',363,'auth_token','054b8895c8ba8015323a30364921fa383c7b8628df5e486627f453020892bdf2','[\"*\"]','2026-06-03 19:49:11',NULL,'2026-06-03 19:49:11','2026-06-03 19:49:11'),
(8,'App\\Models\\User',366,'auth_token','82f21fa1d28737d7c776f1015806eee0fadfeeb0c95ce4db1235e2fe7b21ee95','[\"*\"]',NULL,NULL,'2026-06-11 05:58:20','2026-06-11 05:58:20'),
(9,'App\\Models\\User',366,'auth_token','9356b0fd14a016946906362083af3249f0e98af4b19606d0af53b4f8c199ff25','[\"*\"]',NULL,NULL,'2026-06-11 05:58:21','2026-06-11 05:58:21'),
(10,'App\\Models\\User',367,'auth_token','f3327387316f7d8284da1d558843da7d8e431eb3af744a49d03299b148171986','[\"*\"]','2026-06-11 06:26:26',NULL,'2026-06-11 06:01:30','2026-06-11 06:26:26');

/*Table structure for table `received_payments` */

DROP TABLE IF EXISTS `received_payments`;

CREATE TABLE `received_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `payment_received_by` bigint unsigned DEFAULT NULL,
  `payment_mode` tinyint DEFAULT NULL,
  `payment_carrier` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_received_other` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_received` decimal(8,2) DEFAULT NULL,
  `broker_fee_percentage` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `broker_fee` decimal(8,2) DEFAULT NULL,
  `paypal_fee_percentage` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_fee` decimal(8,2) DEFAULT NULL,
  `tria_fee_percentage` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tria_fee` decimal(8,2) DEFAULT NULL,
  `policy_effective_date` date DEFAULT NULL,
  `policy_expiry_date` date DEFAULT NULL,
  `proof_of_payment` mediumtext COLLATE utf8mb4_unicode_ci,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `user_timezone` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `received_payments_payment_received_by_foreign` (`payment_received_by`),
  KEY `received_payments_lead_id_index` (`lead_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `received_payments` */

/*Table structure for table `sales` */

DROP TABLE IF EXISTS `sales`;

CREATE TABLE `sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lead_id` bigint unsigned NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `affiliate_string` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `referral_string` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `price` decimal(8,2) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_lead_id_foreign` (`lead_id`),
  KEY `sales_affiliate_string_index` (`affiliate_string`),
  KEY `sales_referral_string_index` (`referral_string`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sales` */

/*Table structure for table `sessions` */

DROP TABLE IF EXISTS `sessions`;

CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sessions` */

/*Table structure for table `subscribers` */

DROP TABLE IF EXISTS `subscribers`;

CREATE TABLE `subscribers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `subscribed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscribers_email_unique` (`email`),
  KEY `subscribers_is_active_index` (`is_active`),
  KEY `subscribers_subscribed_at_index` (`subscribed_at`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `subscribers` */

insert  into `subscribers`(`id`,`email`,`name`,`is_active`,`subscribed_at`,`unsubscribed_at`,`created_at`,`updated_at`) values 
(1,'newsletter@example.com','Jane Doe',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(2,'returning@example.com',NULL,1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(3,'friesen.wava@example.org','Kayli Carroll',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(4,'arlene27@example.net','Shemar Gleason',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(5,'janice.kuhic@example.net','Ms. Jaquelin Raynor DVM',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(6,'alice@example.com','Afton Hermiston Jr.',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(7,'bob@other.com','Steve Prosacco',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(9,'marcelina99@example.net','Mrs. Vida Schoen',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11'),
(10,'nreichel@example.com','Haskell Lindgren',1,'2026-06-03 18:43:11',NULL,'2026-06-03 18:43:11','2026-06-03 18:43:11');

/*Table structure for table `us_states` */

DROP TABLE IF EXISTS `us_states`;

CREATE TABLE `us_states` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbreviation` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `us_states_abbreviation_unique` (`abbreviation`),
  KEY `us_states_name_index` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `us_states` */

/*Table structure for table `user_payments` */

DROP TABLE IF EXISTS `user_payments`;

CREATE TABLE `user_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `payment` decimal(8,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_payments_user_id_index` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `user_payments` */

/*Table structure for table `user_roles` */

DROP TABLE IF EXISTS `user_roles`;

CREATE TABLE `user_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_level` tinyint NOT NULL DEFAULT '5',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `user_roles` */

insert  into `user_roles`(`id`,`role_name`,`access_level`,`created_at`,`updated_at`) values 
(1,'Super Admin',0,NULL,NULL),
(2,'Admin',1,NULL,NULL),
(3,'Staff',2,NULL,NULL),
(4,'Customer',5,NULL,NULL),
(5,'Affiliate',6,NULL,NULL),
(6,'Agent',7,NULL,NULL),
(7,'Planner',8,NULL,NULL);

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `agency_id` bigint unsigned DEFAULT NULL,
  `role_id` bigint unsigned NOT NULL DEFAULT '5',
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `referral_string` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `w9_status` tinyint(1) NOT NULL DEFAULT '0',
  `w9_file` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_agency` tinyint(1) NOT NULL DEFAULT '0',
  `is_on_payroll` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `commission_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `commission_flat` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_referral_string_unique` (`referral_string`),
  KEY `users_agency_id_foreign` (`agency_id`),
  KEY `users_role_id_foreign` (`role_id`)
) ENGINE=MyISAM AUTO_INCREMENT=368 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`agency_id`,`role_id`,`email`,`password`,`first_name`,`last_name`,`phone`,`status`,`referral_string`,`w9_status`,`w9_file`,`is_agency`,`is_on_payroll`,`email_verified_at`,`remember_token`,`created_at`,`updated_at`,`deleted_at`,`commission_pct`,`commission_flat`) values 
(1,NULL,5,'veum.macie@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Amiya','Kuhn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:01','NWwnYsgX9E','2026-06-03 18:43:01','2026-06-03 18:43:01',NULL,0.00,0.00),
(2,NULL,2,'krajcik.eldred@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Olin','Murphy',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:01','mstT78QYmc','2026-06-03 18:43:01','2026-06-03 18:43:01',NULL,0.00,0.00),
(3,NULL,2,'lhintz@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hailie','Hyatt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:01','UH7MXUEyTb','2026-06-03 18:43:01','2026-06-03 18:43:01',NULL,0.00,0.00),
(4,NULL,2,'kertzmann.madilyn@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Winnifred','Windler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:01','sPOOQ9Tx6R','2026-06-03 18:43:01','2026-06-03 18:43:01',NULL,0.00,0.00),
(5,NULL,2,'maurine.rosenbaum@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Fritz','Deckow',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:01','LxR363kXON','2026-06-03 18:43:01','2026-06-03 18:43:01',NULL,0.00,0.00),
(6,NULL,2,'fay.auer@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Houston','Cremin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:01','8QzdP1drq2','2026-06-03 18:43:01','2026-06-03 18:43:01',NULL,0.00,0.00),
(7,NULL,2,'declan.jacobi@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Eliezer','Tillman',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','iptAhVMIPb','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(8,NULL,2,'charlene.price@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Virgie','Wintheiser',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','trRQufr9we','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(9,NULL,2,'jeffery66@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Edna','Schaden',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','HqURf2faJB','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(10,NULL,2,'pdickens@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Guido','Klocko',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','sf5tIV4AZ1','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(11,NULL,2,'torphy.jimmie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Shawn','Gutkowski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','yX3mNRpesY','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(12,NULL,2,'ida17@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Elody','Purdy',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','XLWdytxRUE','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(13,NULL,2,'samir.kihn@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Deontae','Luettgen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','KvUR63sYpT','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(14,NULL,4,'goodwin.eula@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jorge','Wilderman',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','WawAdkAVkS','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(15,NULL,2,'bessie96@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Amelie','Dare',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','ge2RzhEEQp','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(16,NULL,4,'sblick@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Citlalli','Kuphal',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','a9NMHQ2OCV','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(17,NULL,2,'wzemlak@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mekhi','Okuneva',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:02','azyWelV1yX','2026-06-03 18:43:02','2026-06-03 18:43:02',NULL,0.00,0.00),
(18,NULL,2,'jonathon15@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gage','Bode',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','G3ZIOa5wgI','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(19,NULL,2,'vida13@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dewitt','Harris',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','ZEOPena70g','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(20,NULL,2,'brakus.irma@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wendell','Corwin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','8pQ45JiGup','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(21,NULL,2,'carolyn.orn@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gabe','Windler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','nsbPzUqEu7','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(22,NULL,2,'vdoyle@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alexzander','Stiedemann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','opZr1Kp9Ce','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(23,NULL,2,'filomena.emmerich@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Arne','Haley',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','X0uFAJCS9L','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(24,NULL,2,'freddy84@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kirstin','Stroman',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','Ox8TMmjOBe','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(25,NULL,2,'deanna.medhurst@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Chris','Hudson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','KiZrMN157g','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(26,NULL,2,'crist.alda@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lera','Parisian',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','ofZTk3wAXX','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(27,NULL,2,'bins.caleigh@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Delfina','Ankunding',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','ZHicoKT4S6','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(28,NULL,2,'kiehn.georgianna@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Natalie','Boyle',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','jkAQTso4yy','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(29,NULL,2,'mireya09@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Fredy','Grant',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','IJ7TTmiBLL','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(30,NULL,2,'ebba00@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Leo','Jaskolski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','RkoQM6mIK5','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(31,NULL,2,'sydni.rogahn@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Aubrey','Brekke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:03','ixnBjGDX5j','2026-06-03 18:43:03','2026-06-03 18:43:03',NULL,0.00,0.00),
(32,NULL,5,'dwindler@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Amari','Stoltenberg',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','facJOOaShT','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(33,NULL,2,'ybarrows@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Danial','Ritchie',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','tjJbGWqR2Q','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(34,NULL,5,'satterfield.gregoria@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Samanta','Mosciski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','3AK0aPa9SJ','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(35,NULL,5,'weimann.wilford@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jordyn','Dietrich',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','mBAX1moX4G','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(36,NULL,5,'percival00@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Blake','Bechtelar',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','vJlqtB9fNK','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(37,NULL,5,'csawayn@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lera','Deckow',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','6ptN2rY8hQ','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(38,NULL,5,'pkessler@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Keyshawn','Kemmer',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','yRS1TimrkU','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(39,NULL,2,'zstamm@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cathrine','Stoltenberg',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','Y4sswdaHvO','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(40,NULL,5,'filiberto.gutmann@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Austin','Powlowski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','NL97a1Jd8h','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(41,NULL,2,'gutkowski.freddie@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Korbin','Muller',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','wYgWY2bHtt','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(42,NULL,5,'konopelski.raymundo@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Raul','Robel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','sufb37zQET','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(43,NULL,5,'sipes.adolphus@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jeanie','Mayert',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','M4bWp5dyMM','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(44,NULL,5,'zlockman@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Aurelio','Kshlerin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','aIxOL1Mzoz','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(45,NULL,5,'arielle16@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jannie','Ortiz',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','WpIv8Gw5VC','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(46,NULL,5,'vblock@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Norbert','Rice',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','fajnTmyr5g','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(47,NULL,2,'vpaucek@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mayra','Kessler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','C7RQg6yTWc','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(48,NULL,6,'kiera03@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Libbie','Schmidt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','tahFi64DpQ','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(49,NULL,5,'tiara05@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Vince','Miller',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','zOTUs2uExG','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(50,NULL,5,'ralph.walter@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Arch','Fritsch',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','Bo2GW54p5p','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(51,NULL,5,'spinka.abdullah@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dannie','Reynolds',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','Bk49n3jEUK','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(52,NULL,2,'derick.marks@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Willard','Mayert',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','lJJEfAJNEr','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(53,NULL,5,'patricia36@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Erich','Green',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','ySs74ldrgR','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(54,NULL,5,'emard.lennie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Easton','Pollich',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','MzN9DANvmv','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(55,NULL,5,'camron44@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jammie','Gleason',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','d0JbYWdRiR','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(56,NULL,2,'gina.hodkiewicz@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Scarlett','Eichmann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','Inh1bFhrCb','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(57,NULL,2,'chauncey.weissnat@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Geovanni','Harris',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','m3m4RkB9wY','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(58,NULL,5,'lisette.volkman@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ellsworth','Donnelly',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','XFaXhc6sOY','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(59,NULL,5,'padberg.alyce@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Elyse','Treutel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','EpPjpb2qJm','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(60,NULL,5,'kstiedemann@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Finn','Hahn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','tIZE0nepUy','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(61,NULL,2,'lueilwitz.stella@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Fabiola','Mann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','c164kI2AVJ','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(62,NULL,5,'lind.eliseo@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jasper','Beier',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','HTWnmV1suO','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(63,NULL,2,'fgusikowski@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cullen','Halvorson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','e7XM7GN5wN','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(64,NULL,5,'blanda.keon@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Reese','West',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','RrXTmNVWf7','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(65,NULL,2,'lisandro73@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ben','Baumbach',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','LP8K2mrRfY','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(66,NULL,5,'hettinger.kaya@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Everett','Nader',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:04','vDxhaJvBoC','2026-06-03 18:43:04','2026-06-03 18:43:04',NULL,0.00,0.00),
(67,NULL,2,'emard.kallie@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Amani','Cruickshank',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','C6Ap5DegBM','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(68,NULL,2,'everette.dare@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kyler','Rau',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','dlt9lUa6mb','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(69,NULL,5,'vgreenfelder@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wayne','Runolfsson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','thV1AtsxhH','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(70,NULL,5,'bashirian.alvera@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gino','Wiegand',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','hrMQEvfF9Y','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(71,NULL,5,'wolf.derrick@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Turner','Cruickshank',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','xTB8tRtVwv','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(72,NULL,2,'hswift@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Makenzie','Reichel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','zPS62rcHYE','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(73,NULL,5,'ena76@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Deven','Dicki',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','jbyuir6xW9','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(74,NULL,5,'rlangworth@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jedidiah','Ankunding',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','PsYiJD8EAe','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(75,NULL,2,'ogutmann@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Joseph','Lindgren',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','aXxmGgx40u','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(76,NULL,5,'agnes36@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dorcas','Wisozk',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','6MDVoehxAF','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(77,NULL,4,'luna87@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Bridie','Wolf',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','Qj7GwJQKg7','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(78,NULL,6,'camila.gaylord@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Greyson','Tromp',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','YqgNBigTPX','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(79,NULL,2,'lonzo.klein@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lucinda','Bernhard',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','QDyMtILSBH','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(80,NULL,5,'peter.von@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Else','Becker',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','c1aqG14kfc','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(81,NULL,5,'albert69@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Korbin','Corwin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','Wugj5mOKnn','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(82,NULL,5,'jamie.klocko@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Valentine','Kerluke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','PKZouPRCu8','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(83,NULL,5,'iva.gutkowski@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Melba','Bernhard',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','ePTekOSegy','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(84,NULL,5,'charlene75@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Etha','Larson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','eA1DqaH0pW','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(85,NULL,2,'bgibson@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Micheal','Lubowitz',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','GOWUB5tkvl','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(86,NULL,6,'tod.christiansen@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cordia','Windler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','oHA8wnCoYG','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(87,NULL,6,'yasmine89@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alysson','Price',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','zDobLmryhr','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(88,NULL,6,'graciela.willms@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jimmie','Runolfsdottir',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','dW8h9kO6pK','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(89,NULL,5,'apadberg@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dallin','Gerhold',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','IJIrPVMDm4','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(90,NULL,5,'helga.wyman@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Aliyah','Cummerata',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','xyparZC9nm','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(91,NULL,2,'ofelia.kunde@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Marianna','Moore',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','wtsaxpUMuS','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(92,NULL,3,'karlee78@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jeffrey','Langworth',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','K12qmJFwZj','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(93,NULL,3,'fredy.runte@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Brennon','Auer',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','gqJjjrWoMA','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(94,NULL,2,'jakubowski.timmothy@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Estella','Friesen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','U25N5jdORr','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(95,NULL,5,'luis.hansen@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Zebediah','Unique',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','xzv4oprLVy','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(96,NULL,5,'florian.hamill@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Vella','Lowe',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','TCyyX85Hfw','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(97,NULL,5,'berge.danyka@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Creola','Ferry',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','hgDjwgglrX','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(98,NULL,5,'tschmitt@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Adelle','Champlin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','fcZqbwZHM9','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(99,NULL,2,'jarvis08@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Johnnie','Murray',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','E03Ppycy2E','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(100,NULL,5,'ebert.randi@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kurt','Stark',NULL,0,NULL,0,NULL,0,0,'2026-06-03 18:43:05','ODxE5yQiJh','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(101,NULL,5,'zwisozk@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Joanny','Hessel',NULL,0,NULL,0,NULL,0,0,'2026-06-03 18:43:05','0mr8MRwGTU','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(102,NULL,5,'oconnell.lois@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lauriane','Zieme',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','BPaftOybps','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(103,NULL,5,'cayla.walsh@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kaela','Wyman',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','RHY8463Lht','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(104,NULL,5,'josh.schimmel@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Susanna','Fritsch',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','0ycXi2btUp','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(105,NULL,2,'rohan.joan@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Fleta','Altenwerth',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','dhPJAVLguY','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(106,NULL,6,'kimberly.lemke@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Elias','Dickinson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','8NciNs7LRO','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(107,NULL,2,'ewilkinson@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Randal','Wisozk',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','q8wwPwpgb8','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(108,NULL,2,'madisyn82@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Maryse','Pagac',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:05','7c8zLhwPeT','2026-06-03 18:43:05','2026-06-03 18:43:05',NULL,0.00,0.00),
(109,NULL,6,'jane.agent@example.com','$2y$10$3dCRFyOuYf83QHM8rk87nOwB1xulOXXoFUyj4rAUnB0awGZw/Rgfy','Jane','Doe',NULL,1,'JYQ3NH6Z',0,NULL,0,0,'2026-06-03 18:43:06',NULL,'2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(110,NULL,2,'braden13@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Tess','Mohr',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','BLqnwZu5df','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(111,NULL,5,'aff@example.com','$2y$10$I3hYDXAAKeMh5FP2BIeBCOFOoMAWeo1r5Znsy9OEpWFN6PkWJVrhC','Aff','User',NULL,1,'DQAKDDDI',0,NULL,0,0,'2026-06-03 18:43:06',NULL,'2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(112,NULL,2,'adeline38@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ashton','Gutkowski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','EjZB7fqNFa','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(113,NULL,7,'planner@example.com','$2y$10$Br9vXwP4TZ42/bbL.WHwn.n56Wp/qXRYMhHm/u5N.rdhiLwZxZQse','Plan','Ner',NULL,1,'5SKFMR6K',0,NULL,0,0,'2026-06-03 18:43:06',NULL,'2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(114,NULL,2,'neha67@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Daron','Adams',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','z90dOXkJLY','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(115,NULL,3,'staff@example.com','$2y$10$z4.iMsDOnp.h4WbDjbzkP.JnmOntPHFycsZfx69mDLINpXa3/Texq','Staff','Person',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06',NULL,'2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(116,NULL,2,'edeckow@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ashtyn','Mayer',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','k3QEEjVNtt','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(117,NULL,5,'bschroeder@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Marcelino','Becker',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','jv78tWlKd0','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(118,NULL,2,'tyrel.murphy@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Maryjane','Cole',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','xe2LslapJt','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(119,NULL,2,'randy82@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Abby','Rempel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','beKOzxdayh','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(120,NULL,6,'hmoore@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dameon','O\'Hara',NULL,1,NULL,0,NULL,0,1,'2026-06-03 18:43:06','nYsuoYWkEM','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,12.00,25.00),
(121,NULL,2,'quincy12@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alden','King',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','mf6ExPeNo9','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(122,NULL,5,'armstrong.bryon@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Luther','Jerde',NULL,0,NULL,0,NULL,0,0,'2026-06-03 18:43:06','GZrFrNZ83t','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(123,NULL,2,'glover.guadalupe@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Updated','Rosenbaum',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','8P8Jz0AgqF','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(124,NULL,2,'conner.mayert@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cecilia','Spencer',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','Dhczk7FfIx','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(125,NULL,5,'leon.renner@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ida','Metz',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','8rSNKQcnHO','2026-06-03 18:43:06','2026-06-03 18:43:06','2026-06-03 18:43:06',0.00,0.00),
(126,NULL,2,'maurice93@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Citlalli','Dibbert',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','eFVCI2Grsu','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(127,NULL,2,'kylie.wiegand@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ezequiel','Gislason',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:06','Hl4xARyBzo','2026-06-03 18:43:06','2026-06-03 18:43:06',NULL,0.00,0.00),
(128,NULL,5,'mabel.kirlin@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lonnie','Rodriguez',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','Uh2e1d1ytk','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(129,NULL,6,'bill91@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Burnice','Morissette',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','KrKDh1SRO4','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(130,NULL,2,'wilton.schmitt@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Brianne','Considine',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','rLbwQovlFf','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(131,NULL,5,'alejandra.wisoky@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ardith','Lubowitz',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','AjNQapuGjj','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(132,NULL,6,'wiegand.aliyah@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Elisa','Schmeler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','MYGO7ohSin','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(133,NULL,2,'wschulist@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lizeth','Stark',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','pQ3cpZYPBo','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(134,NULL,5,'hoyt.maggio@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Maritza','Morissette',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','RJv1SnAeET','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(135,NULL,2,'borer.moses@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Delmer','Mante',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','APgwlyk9hr','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(136,NULL,5,'anderson.aurelio@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kendall','Moen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','vIEhLO6Y67','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(137,NULL,6,'esther11@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Edmund','Willms',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','GSxWjQmNuy','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(138,NULL,2,'kshlerin.werner@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Zakary','Bednar',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','pMt3758Ai7','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(139,NULL,5,'ihartmann@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Glen','Cummerata',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','RDnxz77slS','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(140,NULL,6,'mwalsh@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Rashad','Monahan',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','IcooGIXcnE','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(141,NULL,7,'goodwin.tamia@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Paula','Schroeder',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','NPbH3Kx4YR','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(142,NULL,2,'emmerich.diego@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Randall','Barrows',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','GrRG8whCiE','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(143,NULL,5,'sydnee59@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Zebediah','Unique',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','KTRftWUzA0','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(144,NULL,6,'bednar.marco@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Fredrick','Breitenberg',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','WcjQHaQQNQ','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(145,NULL,2,'alta03@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Norris','O\'Reilly',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','qwowGuR0mw','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(146,NULL,5,'unique.w9.test@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alaina','Oberbrunner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','58aJO69Jzn','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(147,NULL,6,'misty89@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Katrina','Sawayn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','cZhsANCLiB','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(148,NULL,2,'kaela.dooley@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Johnathan','Jast',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','zUVtJh99P0','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(149,NULL,5,'jerde.micheal@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jaden','Homenick',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','LsECLypT0n','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(150,NULL,2,'dpfeffer@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Larissa','Kunde',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','kDy4djLai8','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(151,NULL,5,'alta28@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kara','Hauck',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','OiaO0syISl','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(152,NULL,2,'lamont.grimes@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Joana','Hermiston',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','0S4woZrNEi','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(153,NULL,5,'alan75@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Bill','Reynolds',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:07','Byrf8eMr0I','2026-06-03 18:43:07','2026-06-03 18:43:07',NULL,0.00,0.00),
(154,NULL,4,'erna52@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Murphy','Strosin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','35plpzZ7VU','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(155,NULL,2,'ogleason@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Clement','Torphy',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','gGCFEalfdq','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(156,NULL,6,'maximillian07@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ivy','Dicki',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','Yl3dpUl0If','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(157,NULL,6,'estel12@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ben','Brown',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','4JxbocMSWo','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(158,NULL,6,'blanche.fahey@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Judge','Powlowski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','Ux8cot2UZC','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(159,NULL,6,'grady.ayana@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mittie','Dach',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','eZ1WGzqPdC','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,10.00,5.00),
(160,NULL,2,'pouros.kallie@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Bridget','Kessler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','ZjHSGUlNyE','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(161,NULL,6,'schamberger.gussie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wellington','Koelpin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','9PmIIyyaWW','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(162,NULL,6,'tiffany65@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Brisa','Fahey',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','Ilxj232GEk','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(163,NULL,6,'wsteuber@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Arvel','Wintheiser',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','7Ag5QblbWQ','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(164,NULL,6,'bayer.eulalia@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Bailey','Schamberger',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','POZle2pBVb','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(165,NULL,6,'pheller@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jewel','Lebsack',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','hcMsQAvkK1','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(166,NULL,6,'rquigley@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Walker','Lemke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','qPUAgdtGfb','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(167,NULL,6,'ptromp@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Miller','Smitham',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','iq3uXximS1','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(168,NULL,6,'roob.cristopher@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kamille','Hansen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:08','qi1JV1CVFq','2026-06-03 18:43:08','2026-06-03 18:43:08',NULL,0.00,0.00),
(169,NULL,6,'treva90@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jewell','Zieme',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','SNoywqhfFl','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(170,NULL,6,'leatha.king@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Marcelo','Hamill',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','vtGXF34c0p','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(171,NULL,6,'evert.heller@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Easter','Gleichner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','zhUkotc4T7','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(172,NULL,6,'vince06@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alexandrine','Orn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','wy0GwXDT3d','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(173,NULL,6,'adams.kaela@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Deontae','Bogisich',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','CXVgjFIfz8','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(174,NULL,6,'crohan@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Loyce','Dickens',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','gtbV5PykCP','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(175,NULL,6,'xschoen@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Oren','Romaguera',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','9InWaZbcbk','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(176,NULL,2,'reagan43@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Yasmeen','Moen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','dHqrztqBBT','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(177,NULL,6,'meredith69@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Colleen','Hettinger',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','GSKz73vaK7','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(178,NULL,6,'zola.leannon@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kennedi','Heathcote',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','XR5xzACt20','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(179,NULL,6,'dion79@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Vernon','Kris',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','TFKo26PA8Q','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(180,NULL,5,'njacobs@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Silas','Davis',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:09','3NScL8OMPI','2026-06-03 18:43:09','2026-06-03 18:43:09',NULL,0.00,0.00),
(181,NULL,5,'matteo.franecki@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alanna','Grimes',NULL,1,'MYCODE123',0,NULL,0,0,'2026-06-03 18:43:10','1RurBjOxBB','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(182,NULL,5,'oparker@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Odie','Crist',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','wxNzEWaA7v','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,25.00),
(183,NULL,5,'sabryna81@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Titus','Franecki',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','aLvIDDVEoa','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,12.00,0.00),
(184,NULL,6,'haag.antone@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Javier','Ruecker',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','bwZvylxyyB','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,10.00,5.00),
(185,NULL,6,'karine.trantow@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wava','Prohaska',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','znqsUVE7oe','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,8.00,0.00),
(186,NULL,7,'hill.may@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mariana','Marquardt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','gNPszqBTsf','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(187,NULL,4,'flatley.vicky@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Keith','Will',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','mbhromORHw','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(188,NULL,5,'randall.shanahan@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Blanche','Hilpert',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','j97wn6fQJC','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(189,NULL,7,'blanda.jenifer@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Novella','Koelpin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','YMVYz2f40H','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(190,NULL,4,'evalyn42@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Baby','Swift',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','FBuwF0xz6r','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(191,NULL,5,'keeling.evie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hanna','Hackett',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','0omF0Nn5cL','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(192,NULL,7,'reinger.melyna@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Winifred','Luettgen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','OqppXufzDn','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(193,NULL,4,'farmstrong@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ruthie','O\'Reilly',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','0t4Nr40vC5','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,0.00,0.00),
(194,NULL,6,'west.rashawn@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Tyshawn','Greenholt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:10','4iXMKWIdOq','2026-06-03 18:43:10','2026-06-03 18:43:10',NULL,5.00,10.00),
(195,NULL,5,'gladyce.doyle@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Daisha','Casper',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:11','P36GKwXQNp','2026-06-03 18:43:11','2026-06-03 18:43:11',NULL,0.00,0.00),
(196,NULL,5,'qrobel@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Brendon','Hill',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:11','i7D7Fljvjc','2026-06-03 18:43:11','2026-06-03 18:43:11',NULL,0.00,0.00),
(197,NULL,2,'cormier.sonny@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Johanna','Hartmann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:11','wFPnDhrhnd','2026-06-03 18:43:11','2026-06-03 18:43:11',NULL,0.00,0.00),
(198,NULL,2,'pkeeling@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Otha','Christiansen',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:11','1l4MzHSHFi','2026-06-03 18:43:11','2026-06-03 18:43:11',NULL,0.00,0.00),
(199,NULL,2,'marks.tara@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dillon','Hackett',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:11','5e0lqz9acC','2026-06-03 18:43:11','2026-06-03 18:43:11',NULL,0.00,0.00),
(200,NULL,2,'euna11@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Santa','Reilly',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:11','7EgBzYLXhj','2026-06-03 18:43:11','2026-06-03 18:43:11',NULL,0.00,0.00),
(201,NULL,4,'fstanton@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Terrill','Paucek',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','u27utIcQHs','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(202,NULL,5,'jrutherford@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hilario','O\'Reilly',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','ZauVq3DFXu','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(203,NULL,2,'noemie.muller@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Garry','Flatley',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','lj5vq8UEtw','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(204,NULL,4,'rippin.corrine@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Maryjane','Morar',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','QcSbvcEVpu','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(205,NULL,4,'hickle.ova@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Herbert','Hermann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','Bhmsw1yxuC','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(206,NULL,4,'thiel.jaron@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kaela','Bernhard',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','Wq9K4nDvHe','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(207,NULL,4,'myrna05@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Krystal','Bode',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','aa6AYlpo1m','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(208,NULL,4,'quigley.nikki@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Yolanda','Turcotte',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','ZLz64bFHxy','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(209,NULL,2,'annette97@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Oren','McKenzie',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','mLb6q8JV7i','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(210,NULL,4,'eli33@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gage','Baumbach',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','I0WdLtG8C9','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(211,NULL,4,'bogan.olaf@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Sincere','Witting',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','oKzdrX0RMZ','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(212,NULL,4,'hassan40@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Maymie','Auer',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','gO6KTrCrvK','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(213,NULL,4,'ilockman@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cooper','Cormier',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','a8nFmnWaWs','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(214,NULL,4,'jaquan.bernhard@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Damien','Roberts',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','S6liy0zsaL','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(215,NULL,4,'neal.rohan@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Winston','Aufderhar',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','K5jza9v3rP','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(216,NULL,4,'elsa53@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Chloe','Emard',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','3szjWghVuL','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(217,NULL,4,'kaley79@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Monty','Murphy',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:12','sZqMH0f2kR','2026-06-03 18:43:12','2026-06-03 18:43:12',NULL,0.00,0.00),
(218,NULL,4,'kunze.fabiola@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ludie','Huel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','yvxxsXTppe','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(219,NULL,4,'johnston.charlie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Sonia','Fritsch',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','ePgXyRVnzw','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(220,NULL,4,'greenfelder.doug@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mattie','McDermott',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','LuSjPvZsDA','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(221,NULL,4,'mgerhold@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Larue','Stamm',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','zDWWxrn5Ax','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(222,NULL,4,'rosario28@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Edwin','Swaniawski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','tByuSAtb0h','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(223,NULL,4,'jairo56@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Pat','Rosenbaum',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','Xj77bPlkFG','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(224,NULL,4,'alva70@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ricardo','O\'Conner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','VbjRvKwKtm','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(225,NULL,4,'ischuppe@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ashton','Brown',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','23Fj3CNLw8','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(226,NULL,4,'toy.lela@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Soledad','Walsh',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','mn16gB9TB8','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(227,NULL,4,'pkohler@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alex','Graham',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','mE4oqzs6YK','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(228,NULL,4,'heidenreich.cory@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Katrina','Heidenreich',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','RdplLRuOQJ','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(229,NULL,4,'schmeler.jeanie@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dante','Bernhard',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','0yfu0Oz9mk','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(230,NULL,2,'lynch.carlee@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ivah','Huels',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','Btrki6k0SC','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(231,NULL,4,'thiel.rosella@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lavinia','Kub',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','GlsmQnvbmm','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(232,NULL,4,'cyril98@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dasia','Wolf',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','mc3rbqTZgr','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(233,NULL,2,'marta.hermann@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Chauncey','Greenholt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','0QNrPyFOlm','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(234,NULL,2,'lexus.white@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Prince','Gerhold',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:13','g5EVDfYQ45','2026-06-03 18:43:13','2026-06-03 18:43:13',NULL,0.00,0.00),
(235,NULL,2,'stamm.janice@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Leo','Reichel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','oJXq6hI9Il','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(236,NULL,2,'uboyer@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wayne','West',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','ya4Yo5nQvd','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(237,NULL,2,'hfunk@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Catherine','Von',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','fC9PBpmTzN','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(238,NULL,2,'arianna.watsica@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Amir','Wilkinson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','qFxgRfeV2O','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(239,NULL,4,'brady.mohr@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Nikki','Howe',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','0HOAC1tlji','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(240,NULL,2,'glakin@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Celine','Littel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','33jsWPXBk3','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(241,NULL,1,'sheila.toy@example.com','$2y$10$22n1hFCeIMba5YcZRCiZ2OFhcVP5rIsuQQazXdYkNelLvBoY20ntm','Hanna','Hand',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','RWLqVqGSDiITCjEBpH3fKkAhGvZXaWV3eURZSDgVcGhrqbs3Q78AEbwiA6vQ','2026-06-03 18:43:14','2026-06-11 06:11:20',NULL,0.00,0.00),
(242,NULL,2,'oren93@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Christy','Konopelski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','6voG4bEaxt','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(243,NULL,4,'feichmann@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hettie','Hartmann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','4zr2fCAMVz','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(244,NULL,4,'zachary80@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Louisa','Will',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','lKq7p8xvBW','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(245,NULL,2,'jeanie.zboncak@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Keven','Macejkovic',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','MUDDm7UobN','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(246,NULL,2,'ubaumbach@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kara','Greenfelder',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','TUE4StyKEY','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(247,NULL,4,'morissette.kacey@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dewitt','Terry',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','bezaAySmRG','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(248,NULL,2,'fmueller@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kaela','Bahringer',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','lsGNmQwDQi','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(249,NULL,2,'beatrice.gerlach@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alberto','Reichel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','tkMQQfOpaM','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(250,NULL,4,'oflatley@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Rowena','Nolan',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:14','Bu2ZCHCsO9','2026-06-03 18:43:14','2026-06-03 18:43:14',NULL,0.00,0.00),
(251,NULL,2,'wilderman.donnell@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Madisen','Hickle',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','mVylvJqf6F','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(252,NULL,2,'brown.keely@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kianna','Donnelly',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','X084aDzFKe','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(253,NULL,6,'layla72@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Arnoldo','Bergstrom',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','q1ILLMHxJ8','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(254,NULL,2,'herminia.bergstrom@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alfreda','Wintheiser',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','GIP5S7WrSN','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(255,NULL,6,'nayeli76@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Reginald','Klocko',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','1mKtfZbywu','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(256,NULL,3,'dhodkiewicz@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cade','Keebler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','KsKlaE69FD','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(257,NULL,7,'coby.ankunding@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Camille','Satterfield',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','XABq0TpD6w','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(258,NULL,2,'chowe@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cordell','Olson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','iUL8lhnDmT','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(259,NULL,2,'rwalter@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dorris','Veum',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','xNERrk78yN','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(260,NULL,6,'eva54@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Meredith','Goldner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','3UiS33xGN9','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(261,NULL,2,'witting.crawford@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Cameron','Kris',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','fOAMfErbjJ','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(262,NULL,3,'jbergstrom@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Imani','Larkin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','cvYBKYmhyx','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(263,NULL,2,'earline.heaney@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Anna','Yundt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','0FI8aFuBor','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(264,NULL,7,'xherzog@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Rhianna','Hintz',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','UQGZpP4VxE','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(265,NULL,2,'nelle13@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jaylen','Ratke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','4zRsS9tE7c','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(266,NULL,4,'swift.kali@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Josie','Howe',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','MmvNgtCLUj','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(267,NULL,2,'luisa.klein@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Salvatore','Nikolaus',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','sk2IAJvZdh','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(268,NULL,5,'alayna.rohan@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Faustino','Runolfsson',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','8TqWrp4gqz','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(269,NULL,2,'ihoppe@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Janice','Trantow',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','ngDr5sBq80','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(270,NULL,6,'hilpert.pedro@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jacey','Cummerata',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','tNta4fWl7y','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(271,NULL,2,'kuhic.lucas@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Giovanna','McCullough',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','xpMvvgoYjl','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(272,NULL,2,'alden.nitzsche@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Bill','Stehr',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','DdgUwlE78N','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(273,NULL,6,'morissette.alejandra@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alexandre','Gusikowski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','enPITYBwwc','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(274,NULL,2,'candice82@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Augustine','Rice',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','LphmP6skmT','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(275,NULL,2,'schuppe.clifford@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mae','Muller',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','KOdXnQDTqf','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(276,NULL,6,'murazik.hassie@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Victor','Berge',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','KjIqzUrWEK','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(277,NULL,2,'rory.steuber@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Orin','Labadie',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','rk1RBZvUdy','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(278,NULL,6,'ugusikowski@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Roma','Crooks',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','wyBldyOOhE','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(279,NULL,2,'vlynch@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Andy','Gleichner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','McO2MVqNUE','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(280,NULL,6,'deron.waters@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gene','Orn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:15','fyWfXuMNag','2026-06-03 18:43:15','2026-06-03 18:43:15',NULL,0.00,0.00),
(281,NULL,2,'pouros.tianna@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Rafaela','Dietrich',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','UwAgca39x9','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(282,NULL,3,'hettie.graham@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','London','Schroeder',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','acdwUx9Vov','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(283,NULL,6,'stiedemann.jennie@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kathryne','Roberts',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','LjzbYMqnEV','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(284,NULL,7,'alvis96@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alivia','Marquardt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','lbX1OxFUxc','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(285,NULL,4,'schamberger.tina@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Irwin','Kertzmann',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','7qTma7jnLd','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(286,NULL,5,'wehner.jocelyn@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Garth','Grady',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','MvV5hKkzEl','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(287,NULL,2,'edwin.walker@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Philip','Price',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','rjHsAbsuDW','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(288,NULL,4,'phermann@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hank','Rippin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','aLDbY3dtQE','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(289,NULL,5,'bonnie25@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Providenci','Beier',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','gmLqConlL9','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(290,NULL,2,'awill@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hayden','Wintheiser',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','Okd6U3KMP8','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(291,NULL,6,'juston55@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mikayla','Wintheiser',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','hfFDRzCZ8L','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(292,NULL,4,'oritchie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Koby','Monahan',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','qeIc28QFEF','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(293,NULL,2,'herminio84@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Curt','Abshire',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','u4ZzlU5IF3','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(294,NULL,2,'upfeffer@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Tatyana','Klocko',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','7vUM2uYXJB','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(295,NULL,2,'zspencer@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mellie','Bradtke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','vk3OrTJi72','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(296,NULL,2,'jacobs.anthony@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gayle','Sawayn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','XOozdwmba8','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(297,NULL,2,'rosanna71@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Giovani','Hahn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','yUieQahuvn','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(298,NULL,2,'madie78@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Greta','Moore',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:16','paEf1ZNtIu','2026-06-03 18:43:16','2026-06-03 18:43:16',NULL,0.00,0.00),
(299,NULL,2,'keenan.abshire@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Terry','Nolan',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:17','STEdyV99VG','2026-06-03 18:43:17','2026-06-03 18:43:17',NULL,0.00,0.00),
(300,NULL,2,'alexandre39@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Austin','Rogahn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:17','lMnt6ERxrw','2026-06-03 18:43:17','2026-06-03 18:43:17',NULL,0.00,0.00),
(301,NULL,4,'hudson.sally@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Trudie','Hettinger',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:18','E6RyK8fZDU','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(302,NULL,2,'hills.sophia@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Heath','Howe',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:18','mBV1HHlPNb','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(303,NULL,6,'volkman.leopold@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Nella','Considine',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:18','r1jpNxPTyO','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(304,NULL,7,'dzieme@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mayra','Hagenes',NULL,1,'REF-6BBECE',0,NULL,0,0,'2026-06-03 18:43:18','R3I3JBkKPo','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(305,NULL,7,'vmurray@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Deontae','Mann',NULL,1,'REF-6D2D2E',0,NULL,0,0,'2026-06-03 18:43:18','3QL54jWEyU','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(306,NULL,7,'fbraun@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wava','Leuschke',NULL,1,'REF-PLANNER',0,NULL,0,0,'2026-06-03 18:43:18','SbZShnYHXh','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(307,NULL,7,'jenkins.cale@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Davonte','Auer',NULL,1,'REF-OTHER',0,NULL,0,0,'2026-06-03 18:43:18','9GbGLdg7T0','2026-06-03 18:43:18','2026-06-03 18:43:18',NULL,0.00,0.00),
(308,NULL,7,'keyon.blanda@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Eliza','Bartoletti',NULL,1,'REF-P1',0,NULL,0,0,'2026-06-03 18:43:19','viBwDW7bGH','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(309,NULL,2,'gdamore@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Eileen','Blick',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:19','EGFO5TseRN','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(310,NULL,7,'bailey.johnson@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jaida','Schultz',NULL,1,'REF-P2',0,NULL,0,0,'2026-06-03 18:43:19','CKMWPoDE3a','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(311,NULL,7,'samanta.graham@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Linnie','Nienow',NULL,1,'REF-LIST',0,NULL,0,0,'2026-06-03 18:43:19','2M8O3BRDCv','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(312,NULL,7,'mcclure.halle@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Taurean','Gusikowski',NULL,1,'REF-MINE',0,NULL,0,0,'2026-06-03 18:43:19','c1HkbV7nAz','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(313,NULL,7,'michele51@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Julia','Zboncak',NULL,1,'REF-THEIRS',0,NULL,0,0,'2026-06-03 18:43:19','Rp7CuYUErk','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(314,NULL,7,'jocelyn20@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ricky','Miller',NULL,1,'REF-FLT',0,NULL,0,0,'2026-06-03 18:43:19','SwGbxfolW0','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(315,NULL,7,'mann.jakob@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Darby','Orn',NULL,1,'REF-76CEB8',0,NULL,0,0,'2026-06-03 18:43:19','Fqy0DuGubG','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(316,NULL,2,'yluettgen@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gaylord','Koepp',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:19','wEzoWUoS8f','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(317,NULL,7,'brycen31@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Sylvester','Yundt',NULL,1,'REF-77DDFB',0,NULL,0,0,'2026-06-03 18:43:19','mDsDIqZITa','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(318,NULL,7,'uprosacco@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Armand','Haag',NULL,1,'REF-7918A6',0,NULL,0,0,'2026-06-03 18:43:19','9LJTqNMhuE','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(319,NULL,7,'vfeil@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Haley','Kozey',NULL,1,'REF-792930',0,NULL,0,0,'2026-06-03 18:43:19','8B2kaKzVEq','2026-06-03 18:43:19','2026-06-03 18:43:19',NULL,0.00,0.00),
(320,NULL,2,'modesta.bartell@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Davin','Brekke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','jDV9Bse3Gy','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(321,NULL,2,'crona.myles@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Onie','Quitzon',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','wCLxnWdhHm','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(322,NULL,4,'tromp.sterling@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jackie','Goyette',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','oSUZO9TH9y','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(323,NULL,2,'hills.queenie@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Arvel','Satterfield',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','V3JDbL3ZP6','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(324,NULL,2,'vmurazik@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alfred','Schinner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','WQcX6GpbzX','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(325,NULL,2,'iwilliamson@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Krista','Goldner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','edFTqC7lZv','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(326,NULL,2,'jerome33@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kristina','Greenholt',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','wU7KDf7qmH','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(327,NULL,2,'jerald63@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Carole','Osinski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','cIZSKiop1a','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(328,NULL,2,'nigel38@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lila','Witting',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','HpyF0mDtoQ','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(329,NULL,2,'mya.prohaska@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Celestine','Jaskolski',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:20','Y76wPaL3WX','2026-06-03 18:43:20','2026-06-03 18:43:20',NULL,0.00,0.00),
(330,NULL,2,'leilani99@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Carson','Johns',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','kKmSvEQQ8G','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(331,NULL,2,'elsie84@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Marvin','Casper',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','nWFPEJQCsV','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(332,NULL,2,'linwood14@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Alexandra','Prosacco',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','dFiJMLG5mJ','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(333,NULL,2,'ucummings@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dylan','Block',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','We5EZHAzIh','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(334,NULL,2,'grady.bernier@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Rhoda','Orn',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','3V9JR5Cfgq','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(335,NULL,2,'wkessler@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Hubert','Zulauf',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','JFGoUAK7xN','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(336,NULL,2,'schultz.jeanne@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Carole','Haley',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','rFxP7fxi4y','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(337,NULL,2,'akeem.legros@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Stefanie','Lubowitz',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','iIZPNZwDHL','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(338,NULL,2,'nona.donnelly@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Virginia','Ritchie',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','qUt7uqYAiI','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(339,NULL,2,'jennings85@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Verla','Schroeder',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','TGua8Gb8Zm','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(340,NULL,5,'mbrekke@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Roslyn','Rodriguez',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','IShUho3Z7K','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(341,NULL,5,'kendra32@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Mac','Hammes',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','b5btyPeAZy','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(342,NULL,5,'donnelly.shania@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Larue','Pouros',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','xDH5emvgXt','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(343,NULL,5,'augustus.smitham@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dagmar','Ritchie',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:21','PE43HEbX8n','2026-06-03 18:43:21','2026-06-03 18:43:21',NULL,0.00,0.00),
(344,NULL,5,'stamm.julian@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Al','Kohler',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','mA2VzEfnCc','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(345,NULL,5,'logan.thiel@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Ebba','Ruecker',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','3DAFNBkRyH','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(346,NULL,5,'monserrate.lesch@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jane','Medhurst',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','VoGa0A6wod','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(347,NULL,2,'dennis.roob@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Dean','Kassulke',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','Aft63LGH71','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(348,NULL,5,'chelsea43@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Bernadine','Bode',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','TnUM8WV6Wp','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(349,NULL,2,'devonte23@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Kathryn','Schneider',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','UJCqzs6IML','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(350,NULL,5,'kovacek.jedidiah@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Lorena','Homenick',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','0SITu8462d','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(351,NULL,5,'loraine.orn@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Nash','Gorczany',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','WJPWkkiPKx','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(352,NULL,5,'krajcik.kamren@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Charley','Howe',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','QhDzs0VESP','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(353,NULL,2,'zwaelchi@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Darwin','Russel',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','G8dhAQPD99','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(354,NULL,5,'wrau@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Jacquelyn','Brakus',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','pBG8eizguY','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(355,NULL,5,'kertzmann.cornelius@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Santos','Jerde',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','FswOOZFfyY','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(356,NULL,2,'angelo.jast@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Wilson','Wehner',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','47ZFnRp775','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(357,NULL,5,'lexi.langosh@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Morris','Rau',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','fxNj9KFB1D','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(358,NULL,5,'shaniya67@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Brendon','Parisian',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','kiFw8zvRoY','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(359,NULL,2,'heller.rosalia@example.net','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Niko','Gerhold',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','CbAMn0fVrm','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(360,NULL,5,'alba.little@example.com','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Emmanuelle','Lakin',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','mVNTS3uF0d','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(361,NULL,5,'katlyn.kris@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Gene','Parker',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','Vnevkx0N2s','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(362,NULL,5,'streich.juliet@example.org','$2y$10$iYkv/4s9F.0fExnCD7roj.02f2BJ4eTX1Rkbs0i8PmWhe.vfup20C','Houston','Wiza',NULL,1,NULL,0,NULL,0,0,'2026-06-03 18:43:22','aYxHdqHlc0','2026-06-03 18:43:22','2026-06-03 18:43:22',NULL,0.00,0.00),
(363,NULL,2,'office.haideribex@gmail.com','$2y$10$WqzpP5QGLKnK6jwGELQpM.QIN5rZ9ezthqaJTPSYOByrZR.0IahUm','Haider','Malik','5550009999',1,NULL,0,NULL,0,0,'2026-06-03 19:00:14',NULL,'2026-06-03 19:00:14','2026-06-03 19:49:11',NULL,0.00,0.00),
(364,NULL,4,'maliik7haider@gmail.com','$2y$10$vtnIIqLiIv6.bUS2iC08gOTWhvGBltuP1ZmoOwiWhz5IqP4DmDrgS','Haider','Malik',NULL,1,NULL,0,NULL,0,0,'2026-06-03 19:28:08',NULL,'2026-06-03 19:28:08','2026-06-03 21:57:25',NULL,0.00,0.00),
(365,NULL,5,'office.haideribexx@gmail.com','$2y$10$vpEafjnVRJMVdi6A2Csx4ugralmuwEYdyXrSsCrOafsZbyWg6Qf9e','Haider','Malik','0313-5769879',0,'YMITB1XJ',0,NULL,0,0,NULL,NULL,'2026-06-11 05:50:03','2026-06-11 05:50:03',NULL,0.00,0.00),
(366,NULL,5,'aff_1781157499@example.com','$2y$10$4mq768hb/qhJQQRNGhwdWeJuIX4jPz99lT6USRX8YJTk318Gp.3dW','Test','Affiliate','5551234567',0,'0ULC1WCE',0,NULL,0,0,NULL,NULL,'2026-06-11 05:58:20','2026-06-11 05:58:20',NULL,0.00,0.00),
(367,NULL,5,'office.haideribeex@gmail.com','$2y$10$g1LMWk.MyE0hh9wgJI3D5.CqSkEnVKULy8Ib8XFmBHQfrZAb8q8IS','Haider','Malik','0313-5769879',0,'GNSUFK5X',0,NULL,0,0,NULL,NULL,'2026-06-11 06:01:30','2026-06-11 06:01:30',NULL,0.00,0.00);

/*Table structure for table `w9_uploads` */

DROP TABLE IF EXISTS `w9_uploads`;

CREATE TABLE `w9_uploads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint unsigned NOT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verified_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `w9_uploads_verified_by_foreign` (`verified_by`),
  KEY `w9_uploads_user_id_created_at_index` (`user_id`,`created_at`)
) ENGINE=MyISAM AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `w9_uploads` */

insert  into `w9_uploads`(`id`,`user_id`,`file_path`,`file_name`,`file_size`,`verified_at`,`verified_by`,`created_at`,`updated_at`) values 
(1,131,'referrals/131-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(2,132,'referrals/132-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(3,134,'referrals/134-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(4,136,'referrals/136-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(5,137,'referrals/137-w9-20260603184307.pdf','w9.pdf',1024,'2026-06-03 18:43:07',135,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(6,139,'referrals/139-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(7,140,'referrals/140-w9-20260603184307.pdf','w9.pdf',1024,'2026-06-03 18:43:07',138,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(8,141,'referrals/141-w9-20260603184307.pdf','w9.pdf',1024,'2026-06-03 18:43:07',138,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(9,143,'referrals/143-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(10,144,'referrals/144-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(11,146,'referrals/146-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(12,147,'referrals/147-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(13,149,'referrals/149-w9-20260603184307.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(14,151,'referrals/151-w9-20260603184307.pdf','w9.pdf',1024,'2026-06-03 18:43:07',150,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(15,153,'referrals/153-w9-20260603184307.pdf','w9.pdf',1024,'2026-06-03 18:43:07',152,'2026-06-03 18:43:07','2026-06-03 18:43:07'),
(16,161,'referrals/test.pdf','w9.pdf',512,'2026-06-03 18:43:08',160,'2026-06-03 18:43:08','2026-06-03 18:43:08'),
(17,177,'referrals/test.pdf','w9.pdf',512,'2026-06-03 18:43:09',176,'2026-06-03 18:43:09','2026-06-03 18:43:09'),
(18,210,'referrals/test.pdf','w9.pdf',512,'2026-06-03 18:43:12',209,'2026-06-03 18:43:12','2026-06-03 18:43:12'),
(19,231,'referrals/test.pdf','w9.pdf',512,'2026-06-03 18:43:13',230,'2026-06-03 18:43:13','2026-06-03 18:43:13'),
(20,310,'referrals/test.pdf','w9.pdf',512,'2026-06-03 18:43:19',309,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(21,317,'referrals/test.pdf','w9.pdf',512,'2026-06-03 18:43:19',316,'2026-06-03 18:43:19','2026-06-03 18:43:19'),
(22,343,'referrals/343-w9-20260603184321.pdf','my-w9.pdf',524288,NULL,NULL,'2026-06-03 18:43:21','2026-06-03 18:43:21'),
(23,345,'referrals/1-w9-20260423.pdf','w9.pdf',1024,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(24,346,'referrals/1-w9-20260423.pdf','w9.pdf',1024,'2026-06-03 18:43:22',NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(25,348,'referrals/2-w9-20260423.pdf','w9.pdf',2048,'2026-06-03 18:43:22',347,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(26,350,'referrals/2-w9-20260423.pdf','w9.pdf',2048,'2026-06-03 18:43:22',349,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(27,352,'referrals/2-w9-20260423.pdf','w9.pdf',512,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(28,354,'p1.pdf','w9-v1.pdf',512,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(29,354,'p2.pdf','w9-v2.pdf',1024,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(30,357,'referrals/3-w9-20260423.pdf','w9.pdf',1024,'2026-06-03 18:43:22',356,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(31,360,'referrals/3-w9-20260423.pdf','w9.pdf',1024,'2026-06-03 18:43:22',359,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(32,361,'referrals/361-w9-20260603184322.pdf','w9-v1.pdf',102400,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(33,361,'referrals/361-w9-20260603184322.pdf','w9-v2.pdf',204800,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(34,362,'p1.pdf','old.pdf',100,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22'),
(35,362,'p2.pdf','new.pdf',200,NULL,NULL,'2026-06-03 18:43:22','2026-06-03 18:43:22');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
