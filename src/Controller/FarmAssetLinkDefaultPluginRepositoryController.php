<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Defines FarmAssetLinkDefaultPluginRepositoryController class.
 */
class FarmAssetLinkDefaultPluginRepositoryController extends ControllerBase {

  /**
   * {@inheritdoc}
   */
  public function Render() {
    $base_path = base_path();

    $storage = \Drupal::entityTypeManager()->getStorage('asset_link_default_plugin');
    $ids = \Drupal::entityQuery('asset_link_default_plugin')->execute();
    $defaultPluginConfigs = $storage->loadMultiple($ids);

    $plugins = [];

    foreach($defaultPluginConfigs as $defaultPluginConfig) {
      if (!$defaultPluginConfig->status()) {
        continue;
      }

      $raw_url = $defaultPluginConfig->url();
      $url = str_replace("{base_path}", $base_path, $raw_url);

      $plugins[] = ['url' => $url];
    }

    return new JsonResponse([ 'plugins' => $plugins ]);
  }

}
