<?php
/**
 * Plugin Name: Vocally Agent
 * Plugin URI: https://vocally.ai
 * Description: Embed your Vocally AI agent on your WordPress site as a floating chat bubble or via shortcode.
 * Version: 1.0.0
 * Author: Vocally
 * Author URI: https://vocally.ai
 * License: GPL-2.0-or-later
 * Text Domain: vocally
 *
 * @package Vocally
 */

if (!defined('ABSPATH')) {
	exit;
}

define('VOCALLY_VERSION', '1.0.0');
define('VOCALLY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('VOCALLY_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once VOCALLY_PLUGIN_DIR . 'includes/class-vocally-settings.php';
require_once VOCALLY_PLUGIN_DIR . 'includes/class-vocally-embed.php';

/**
 * Bootstrap plugin.
 */
function vocally_init(): void {
	Vocally_Settings::register();
	Vocally_Embed::register();
}
add_action('plugins_loaded', 'vocally_init');
