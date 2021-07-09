<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;

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
   * Top-level handler for demo page requests.
   */
  public function content() {
    return [
      '#markup' => '<div id="farm-asset-link-app"></div>',
      '#attached' => [
        'library' => [
          'farmos_asset_link/farmos_asset_link'
        ],
      ],
    ];
  }

}
