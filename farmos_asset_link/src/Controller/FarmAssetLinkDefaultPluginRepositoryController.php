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

      $moduleScopePos = strpos($url, '{module}');
      if ($moduleScopePos > -1) {
          if ($moduleScopePos !== 0) {
              \Drupal::logger('farmos_asset_link')->notice("Invalid use of module scope for Asset Link plugin url in config " . $defaultPluginConfig->getConfigDependencyName());
              continue;
          }

          $moduleDeps = $defaultPluginConfig->getDependencies()['module'];

          if (count($moduleDeps) != 1) {
              \Drupal::logger('farmos_asset_link')->notice("Ambiguous use of module scope for Asset Link plugin url - expected exactly one dependency for " . $defaultPluginConfig->getConfigDependencyName());
              continue;
          }

          $urlSuffix = str_replace("{module}", "", $url);

          $expectedSuffix = $defaultPluginConfig->id() . ".alink.";

          if (strpos($urlSuffix, $expectedSuffix) !== 0) {
              \Drupal::logger('farmos_asset_link')->notice("Invalid use of module scope for Asset Link plugin url - expected url following module to be '$expectedSuffix'. Instead got '$urlSuffix'");
              continue;
          }

          $url = str_replace("{module}", "{base_path}alink/plugins/~", $url);
      }

      $url = str_replace("{base_path}", $base_path, $url);

      $plugins[] = ['url' => $url];
    }

    return new JsonResponse([ 'plugins' => $plugins ]);
  }

}
