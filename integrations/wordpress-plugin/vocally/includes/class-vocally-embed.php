<?php
/**
 * Front-end embed: floating widget and shortcode.
 *
 * @package Vocally
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Renders Vocally chat widget iframes on the public site.
 */
class Vocally_Embed {
	/**
	 * Register hooks and shortcode.
	 */
	public static function register(): void {
		add_action('wp_footer', array(self::class, 'render_floating'), 20);
		add_shortcode('vocally_agent', array(self::class, 'shortcode'));
	}

	/**
	 * Build widget embed URL from settings.
	 *
	 * @param array<string, string> $settings Plugin settings.
	 * @return string|null Embed URL or null if misconfigured.
	 */
	public static function build_embed_url(array $settings): ?string {
		$app_url  = rtrim($settings['app_url'] ?? '', '/');
		$agent_id = $settings['agent_id'] ?? '';

		if ($app_url === '' || $agent_id === '') {
			return null;
		}

		$params = array(
			'title'   => $settings['widget_title'] ?? 'Support',
			'welcome' => $settings['welcome_message'] ?? 'Hello! How can I help you today?',
		);

		$token = trim($settings['widget_token'] ?? '');
		if ($token !== '') {
			$params['token'] = $token;
		}

		$query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

		return $app_url . '/widget/' . rawurlencode($agent_id) . '?' . $query;
	}

	/**
	 * Output floating iframe in footer when mode is floating.
	 */
	public static function render_floating(): void {
		if (is_admin()) {
			return;
		}

		$settings = Vocally_Settings::get_settings();
		if (($settings['display_mode'] ?? 'floating') !== 'floating') {
			return;
		}

		$embed_url = self::build_embed_url($settings);
		if ($embed_url === null) {
			return;
		}

		$title = $settings['widget_title'] ?? 'Support';
		echo self::floating_markup($embed_url, $title); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Shortcode [vocally_agent] or [vocally_agent height="600"].
	 *
	 * @param array<string, string>|string $atts Shortcode attributes.
	 * @return string
	 */
	public static function shortcode($atts): string {
		$settings = Vocally_Settings::get_settings();
		$embed_url = self::build_embed_url($settings);

		if ($embed_url === null) {
			return '';
		}

		$atts = shortcode_atts(
			array(
				'height' => '600',
			),
			is_array($atts) ? $atts : array(),
			'vocally_agent'
		);

		$height = max(200, (int) $atts['height']);
		$title  = $settings['widget_title'] ?? 'Support';

		return self::iframe_markup($embed_url, $title, $height);
	}

	/**
	 * Inline iframe HTML.
	 *
	 * @param string $embed_url Widget URL.
	 * @param string $title     Accessible title.
	 * @param int    $height    Pixel height.
	 * @return string
	 */
	private static function iframe_markup(string $embed_url, string $title, int $height): string {
		return sprintf(
			'<iframe src="%s" style="width:100%%;height:%dpx;border:none;border-radius:12px" title="%s" loading="lazy"></iframe>',
			esc_url($embed_url),
			$height,
			esc_attr(sprintf(/* translators: %s: agent display name */ __('Chat with %s', 'vocally'), $title))
		);
	}

	/**
	 * Floating bubble markup (matches Vocally dashboard embed snippet).
	 *
	 * @param string $embed_url Widget URL.
	 * @param string $title     Accessible title.
	 * @return string
	 */
	private static function floating_markup(string $embed_url, string $title): string {
		$container_id = 'vocally-widget';
		$embed_js  = esc_js($embed_url);
		$title_js  = esc_js(sprintf(/* translators: %s: agent display name */ __('Chat with %s', 'vocally'), $title));

		return '<div id="' . esc_attr($container_id) . '"></div>
<script>
(function() {
  var el = document.getElementById("' . esc_js($container_id) . '");
  if (!el) return;
  var iframe = document.createElement("iframe");
  iframe.src = "' . $embed_js . '";
  iframe.style.cssText = "position:fixed;bottom:24px;right:24px;width:380px;height:540px;border:none;border-radius:16px;z-index:2147483647;box-shadow:0 8px 32px rgba(0,0,0,0.12)";
  iframe.title = "' . $title_js . '";
  iframe.setAttribute("loading", "lazy");
  el.appendChild(iframe);
})();
</script>';
	}
}
