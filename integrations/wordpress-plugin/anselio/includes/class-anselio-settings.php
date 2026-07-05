<?php
/**
 * Admin settings for Anselio WordPress plugin.
 *
 * @package Anselio
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Settings page under Settings → Anselio.
 */
class Anselio_Settings {
	public const OPTION_GROUP = 'anselio_options';
	public const OPTION_NAME  = 'anselio_settings';

	/**
	 * Register settings and admin page.
	 */
	public static function register(): void {
		add_action('admin_init', array(self::class, 'register_settings'));
		add_action('admin_menu', array(self::class, 'add_menu_page'));
	}

	/**
	 * Default option values.
	 *
	 * @return array<string, string>
	 */
	public static function defaults(): array {
		return array(
			'app_url'       => '',
			'agent_id'      => '',
			'widget_token'  => '',
			'display_mode'  => 'floating',
			'widget_title'  => 'Support',
			'welcome_message' => 'Hello! How can I help you today?',
		);
	}

	/**
	 * Get merged settings.
	 *
	 * @return array<string, string>
	 */
	public static function get_settings(): array {
		$stored = get_option(self::OPTION_NAME, array());
		if (!is_array($stored)) {
			$stored = array();
		}
		return array_merge(self::defaults(), $stored);
	}

	/**
	 * Register WordPress settings API.
	 */
	public static function register_settings(): void {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_NAME,
			array(
				'type'              => 'array',
				'sanitize_callback' => array(self::class, 'sanitize'),
				'default'           => self::defaults(),
			)
		);

		add_settings_section(
			'anselio_main',
			__('Connection', 'anselio'),
			static function (): void {
				echo '<p>' . esc_html__(
					'Copy these values from your Anselio dashboard: Agent → Deploy → WordPress → Setup.',
					'anselio'
				) . '</p>';
			},
			'anselio'
		);

		$fields = array(
			'app_url'         => array(__('Anselio App URL', 'anselio'), 'url'),
			'agent_id'        => array(__('Agent ID', 'anselio'), 'text'),
			'widget_token'    => array(__('Widget token (optional)', 'anselio'), 'text'),
			'display_mode'    => array(__('Display mode', 'anselio'), 'select'),
			'widget_title'    => array(__('Chat title', 'anselio'), 'text'),
			'welcome_message' => array(__('Welcome message', 'anselio'), 'textarea'),
		);

		foreach ($fields as $key => $meta) {
			add_settings_field(
				'anselio_' . $key,
				$meta[0],
				array(self::class, 'render_field'),
				'anselio',
				'anselio_main',
				array(
					'key'  => $key,
					'type' => $meta[1],
				)
			);
		}
	}

	/**
	 * Sanitize settings on save.
	 *
	 * @param mixed $input Raw input.
	 * @return array<string, string>
	 */
	public static function sanitize($input): array {
		$defaults = self::defaults();
		$output   = $defaults;

		if (!is_array($input)) {
			return $output;
		}

		$output['app_url'] = isset($input['app_url'])
			? esc_url_raw(trim((string) $input['app_url']))
			: '';
		$output['app_url'] = rtrim($output['app_url'], '/');

		$output['agent_id'] = isset($input['agent_id'])
			? sanitize_text_field((string) $input['agent_id'])
			: '';

		$output['widget_token'] = isset($input['widget_token'])
			? sanitize_text_field((string) $input['widget_token'])
			: '';

		$mode = isset($input['display_mode']) ? (string) $input['display_mode'] : 'floating';
		$output['display_mode'] = in_array($mode, array('floating', 'shortcode_only'), true)
			? $mode
			: 'floating';

		$output['widget_title'] = isset($input['widget_title'])
			? sanitize_text_field((string) $input['widget_title'])
			: $defaults['widget_title'];

		$output['welcome_message'] = isset($input['welcome_message'])
			? sanitize_textarea_field((string) $input['welcome_message'])
			: $defaults['welcome_message'];

		return $output;
	}

	/**
	 * Add settings submenu.
	 */
	public static function add_menu_page(): void {
		add_options_page(
			__('Anselio', 'anselio'),
			__('Anselio', 'anselio'),
			'manage_options',
			'anselio',
			array(self::class, 'render_page')
		);
	}

	/**
	 * Render a settings field.
	 *
	 * @param array<string, string> $args Field args.
	 */
	public static function render_field(array $args): void {
		$key      = $args['key'];
		$type     = $args['type'];
		$settings = self::get_settings();
		$value    = $settings[ $key ] ?? '';

		if ($type === 'select') {
			?>
			<select name="<?php echo esc_attr(self::OPTION_NAME . '[' . $key . ']'); ?>" id="anselio_<?php echo esc_attr($key); ?>">
				<option value="floating" <?php selected($value, 'floating'); ?>>
					<?php esc_html_e('Floating bubble (site-wide)', 'anselio'); ?>
				</option>
				<option value="shortcode_only" <?php selected($value, 'shortcode_only'); ?>>
					<?php esc_html_e('Shortcode only', 'anselio'); ?>
				</option>
			</select>
			<p class="description">
				<?php
				esc_html_e(
					'Use [anselio_agent] in a page or post when shortcode only is selected.',
					'anselio'
				);
				?>
			</p>
			<?php
			return;
		}

		if ($type === 'textarea') {
			?>
			<textarea
				name="<?php echo esc_attr(self::OPTION_NAME . '[' . $key . ']'); ?>"
				id="anselio_<?php echo esc_attr($key); ?>"
				class="large-text"
				rows="3"
			><?php echo esc_textarea($value); ?></textarea>
			<?php
			return;
		}

		$input_type = $type === 'url' ? 'url' : 'text';
		?>
		<input
			type="<?php echo esc_attr($input_type); ?>"
			name="<?php echo esc_attr(self::OPTION_NAME . '[' . $key . ']'); ?>"
			id="anselio_<?php echo esc_attr($key); ?>"
			value="<?php echo esc_attr($value); ?>"
			class="regular-text"
			<?php echo $key === 'widget_token' ? 'autocomplete="off"' : ''; ?>
		/>
		<?php
		if ($key === 'agent_id') {
			echo '<p class="description">' . esc_html__(
				'Found in Anselio under Deploy → WordPress → Setup.',
				'anselio'
			) . '</p>';
		}
	}

	/**
	 * Render settings page.
	 */
	public static function render_page(): void {
		if (!current_user_can('manage_options')) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html(get_admin_page_title()); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields(self::OPTION_GROUP);
				do_settings_sections('anselio');
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
