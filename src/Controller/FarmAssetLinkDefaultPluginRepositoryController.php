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

    $plugins = [
      ['url' => $base_path . 'alink/alink-plugins/AssetPage.alink.vue'],
      ['url' => $base_path . 'alink/alink-plugins/AssetActionsPageSlotProvider.alink.vue'],
      ['url' => $base_path . 'alink/alink-plugins/AssetNameWithArchivedWidgetDecorator.alink.vue'],
      ['url' => $base_path . 'alink/alink-plugins/AssetNameWithGenderWidgetDecorator.alink.vue'],
      ['url' => $base_path . 'alink/alink-plugins/ArchiveAssetActionProvider.alink.js'],
      ['url' => $base_path . 'alink/alink-plugins/RenameAssetActionProvider.alink.js'],
      ['url' => $base_path . 'alink/alink-plugins/OpenInFarmOSMetaActionProvider.alink.js'],
      ['url' => $base_path . 'alink/alink-plugins/MoveAssetActionProvider.alink.vue'],
      ['url' => $base_path . 'alink/alink-plugins/NameBasedAssetSearcher.alink.js'],
      ['url' => $base_path . 'alink/alink-plugins/UrlBasedAssetSearcher.alink.js'],
      ['url' => $base_path . 'alink/alink-plugins/ProximityAssetSearcher.alink.js'],
      ['url' => $base_path . 'alink/alink-plugins/ManagePlugins.alink.vue'],
    ];

    return new JsonResponse([ 'plugins' => $plugins ]);
  }

}
