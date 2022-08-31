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

      $url = $defaultPluginConfig->url();

      $moduleScopePos = strpos($url, '{module:');
      if ($moduleScopePos > -1) {
          if ($moduleScopePos !== 0) {
              \Drupal::logger('farmos_asset_link')->notice("Invalid use of module scope for Asset Link plugin url in config " . $defaultPluginConfig->getConfigDependencyName());
              continue;
          }

          $urlSuffix = preg_replace('/^\{module:[^\}]+\}\/?/', "", $url);

          $expectedPrefix = $defaultPluginConfig->id() . ".alink.";

          if (strpos($urlSuffix, $expectedPrefix) !== 0) {
              \Drupal::logger('farmos_asset_link')->notice("Invalid use of module scope for Asset Link plugin url - expected url following module scope to be '$expectedSuffix'. Instead got '$urlSuffix'");
              continue;
          }

          $url = "{base_path}alink/plugins/~$urlSuffix";
      }

      $url = str_replace("{base_path}", $base_path, $url);

      $plugins[] = ['url' => $url];
    }

    return new JsonResponse([ 'plugins' => $plugins ]);
  }

}
