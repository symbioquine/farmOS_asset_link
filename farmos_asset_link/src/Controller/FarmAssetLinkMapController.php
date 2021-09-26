<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Controller\ControllerBase;
use \Symfony\Component\HttpFoundation\Response;
use \Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\InsertCommand;

/**
 * Defines FarmAssetLinkMapController class.
 */
class FarmAssetLinkMapController extends ControllerBase {

  /**
   * {@inheritdoc}
   */
  public function Render() {
    $build = [
      'map-prototype' => [
        '#type' => 'farm_map',
        '#attributes' => [
          'id' => 'farm-asset-link-map-prototype',
          'data-map-instantiator' => 'farm-asset-link',
        ],
      ],
      '#attached' => [
        'library' => [
          'core/drupal',
          'core/drupalSettings',
          'farm_map/farm_map',
        ],
      ],
    ];

    $response = new AjaxResponse();

    $response->addCommand(new InsertCommand('#selected-zzz', $build));

    return $response;
  }

}