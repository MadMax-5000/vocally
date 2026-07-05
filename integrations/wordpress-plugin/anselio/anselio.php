<?php
/**
 * Plugin Name: Anselio Agent
 * Plugin URI: https://anselio.com
 * Description: Embed your Anselio AI agent on your WordPress site as a floating chat bubble or via shortcode.
 * Version: 1.0.0
 * Author: Anselio
 * Author URI: https://anselio.com
 * License: GPL-2.0-or-later
 * Text Domain: anselio
 *
 * @package Anselio
 */

if (!defined('ABSPATH')) {
	exit;
}

define('ANSELIO_VERSION', '1.0.0');
define('ANSELIO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ANSELIO_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once ANSELIO_PLUGIN_DIR . 'includes/class-anselio-settings.php';
require_once ANSELIO_PLUGIN_DIR . 'includes/class-anselio-embed.php';

/**
 * Bootstrap plugin.
 */
function anselio_init(): void {
	Anselio_Settings::register();
	Anselio_Embed::register();
}
add_action('plugins_loaded', 'anselio_init');
