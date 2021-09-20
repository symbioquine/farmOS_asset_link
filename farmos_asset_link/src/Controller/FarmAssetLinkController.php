<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\Core\Render\HtmlResponse;

use Drupal\Component\Utility\UrlHelper;

use Drupal\Core\Render\BareHtmlPageRenderer;



/**
 * Defines FarmAssetLinkController class.
 */
class FarmAssetLinkController extends ControllerBase {

  /**
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;


  /**
   * Constructs a new FarmAssetLinkController object.
   *
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *          The request stack.
   * @param \Drupal\Core\State\State $state
   *          The object State.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   */
  public function __construct(RequestStack $request_stack, ConfigFactoryInterface $config_factory,
    AccountProxyInterface $currentUser) {
    $this->requestStack = $request_stack;
    $this->configFactory = $config_factory;
    $this->currentUser = $currentUser;
  }

  /**
   * Top-level handler for asset link requests.
   */
  public function content() {
    $siteName = $this->configFactory->get('system.site')->get('name');

    $response = $this->renderBarePage([], 'Asset Link', 'asset_link_page', [
      '#attached' => [
        'library' => [
          'farmos_asset_link/farmos_asset_link'
        ],
        'drupalSettings' => [
          'farmos_asset_link' => [
            'site_name' => $siteName,
          ],
        ],
      ],
    ]);

    return $response;
  }

  // based on https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Render%21BareHtmlPageRenderer.php/function/BareHtmlPageRenderer%3A%3ArenderBarePage/8.2.x
  private function renderBarePage(array $content, $title, $page_theme_property, array $page_additions = []) {
    $attributes = [
      'class' => [
        str_replace('_', '-', $page_theme_property),
      ],
    ];
    $html = [
      '#type' => 'html',
      '#attributes' => $attributes,
      'page' => [
        '#type' => 'page',
        '#theme' => $page_theme_property,
        '#title' => $title,
        'content' => $content,
      ] + $page_additions,
    ];

    // For backwards compatibility.
    // @todo In Drupal 9, add a $show_messages function parameter.
    if (!isset($page_additions['#show_messages']) || $page_additions['#show_messages'] === TRUE) {
      $html['page']['highlighted'] = [
        '#type' => 'status_messages',
      ];
    }

    // Attach favicon.
    if (theme_get_setting('features.favicon')) {
      $favicon = theme_get_setting('favicon.url');
      $type = theme_get_setting('favicon.mimetype');
      $html['page']['#attached']['html_head_link'][][] = array(
        'rel' => 'shortcut icon',
        'href' => UrlHelper::stripDangerousProtocols($favicon),
        'type' => $type,
      );
    }

    // Get the major Drupal version.
    list($version, ) = explode('.', \Drupal::VERSION);

    // Attach default meta tags.
    $meta_default = array(
      // Make sure the Content-Type comes first because the IE browser may be
      // vulnerable to XSS via encoding attacks from any content that comes
      // before this META tag, such as a TITLE tag.
      'system_meta_content_type' => array(
        '#tag' => 'meta',
        '#attributes' => array(
          'charset' => 'utf-8',
        ),
        // Security: This always has to be output first.
        '#weight' => -1000,
      ),
      // Show Drupal and the major version number in the META GENERATOR tag.
      'system_meta_generator' => array(
        '#type' => 'html_tag',
        '#tag' => 'meta',
        '#attributes' => array(
          'name' => 'Generator',
          'content' => 'Drupal ' . $version . ' (https://www.drupal.org)',
        ),
      ),
      // Attach default mobile meta tags for responsive design.
      'MobileOptimized' => array(
        '#tag' => 'meta',
        '#attributes' => array(
          'name' => 'MobileOptimized',
          'content' => 'width',
        ),
      ),
      'HandheldFriendly' => array(
        '#tag' => 'meta',
        '#attributes' => array(
          'name' => 'HandheldFriendly',
          'content' => 'true',
        ),
      ),
      'viewport' => array(
        '#tag' => 'meta',
        '#attributes' => array(
          'name' => 'viewport',
          'content' => 'width=device-width, initial-scale=1.0',
        ),
      ),
    );
    foreach ($meta_default as $key => $value) {
      $html['page']['#attached']['html_head'][] = [
        $value,
        $key,
      ];
    }

    \Drupal::service('renderer')->renderRoot($html);

    $response = new HtmlResponse();
    $response->setContent($html);

    // Process attachments, because this does not go via the regular render
    // pipeline, but will be sent directly.
    $response = \Drupal::service('html_response.attachments_processor')->processAttachments($response);

    return $response;
  }

}
