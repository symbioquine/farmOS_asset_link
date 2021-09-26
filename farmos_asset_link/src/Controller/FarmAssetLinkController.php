<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\Core\Render\HtmlResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Cookie;

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
    $request = $this->requestStack->getCurrentRequest();
    $path = $request->getPathInfo();

    if (strpos($path, '/alink') !== 0) {
      $response = new Response();
      $response->setStatusCode(400);
      $response->headers->set('Content-Type', 'text/plain');
      $response->setContent("This controller is only intended to serve paths under /alink");
      return $response;
    }

    // This should never happen since a compliant web server should handle sending a 400 for requests with relative paths
    // but since it could be a pretty bad security vulnerbility if this ever got through we'll defend against it.
    // https://datatracker.ietf.org/doc/html/rfc7230#section-5.3.1
    if (strpos($path, '../') !== false) {
      $response = new Response();
      $response->setStatusCode(400);
      $response->headers->set('Content-Type', 'text/plain');
      $response->setContent("This controller is only intended to serve paths under /alink");
      return $response;
    }

    // TODO: Use injected services here
    $module_base_path = \Drupal::service('file_system')->realpath(\Drupal::service('module_handler')->getModule('farmos_asset_link')->getPath());

    $asset_link_dist_path = "$module_base_path/asset-link-dist/";

    // Remove the '/alink' prefix
    $path_suffix = substr($path, 6);

    $file_path = $asset_link_dist_path . $path_suffix;

    if (empty($path_suffix) || $path_suffix === '/' || !file_exists($file_path)) {
      $file_path = $asset_link_dist_path . "index.html";
    }

    $content_type = $this->getContentMimetype($file_path);

    $response_content = file_get_contents($file_path);

    $base_path = base_path();

    $response_content = str_replace('/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/', $base_path . 'alink/', $response_content);

    if (false) dd([
      '$path' => $path,
      '$file_path' => $file_path,
      '$path_suffix' => $path_suffix,
      'file_exists($file_path)' => file_exists($file_path),
      '$content_type' => $content_type,
      '$response_content' => $response_content,
    ]);

    $response = new Response();
    $response->setStatusCode(200);

    $cookie_expiry_epoch_sec = time() + (14 * 24 * 60 * 60);

    $cookie = new Cookie('assetLinkDrupalBasePath', $base_path, $expire = $cookie_expiry_epoch_sec, $path = '/', $domain = null, $secure = false, $httpOnly = false, $raw = true, $sameSite = null);
    $response->headers->setCookie($cookie);

    $response->headers->set('Content-Type', $content_type);
    $response->setContent($response_content);
    return $response;
  }

  // roughly based on https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
  private function getContentMimetype($file_path) {
    $extname = pathinfo($file_path, PATHINFO_EXTENSION);

    $mime_types = [
      'html' => 'text/html',
      'js' => 'text/javascript',
      'css' => 'text/css',
      'json' => 'application/json',
      'png' => 'image/png',
      'jpg' => 'image/jpg',
      'gif' => 'image/gif',
      'svg' => 'image/svg+xml',
      'wav' => 'audio/wav',
      'mp4' => 'video/mp4',
      'woff' => 'application/font-woff',
      'ttf' => 'application/font-ttf',
      'eot' => 'application/vnd.ms-fontobject',
      'otf' => 'application/font-otf',
      'wasm' => 'application/wasm',
    ];

    return $mime_types[$extname] ?? 'application/octet-stream';
  }

}
