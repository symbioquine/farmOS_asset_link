<?php

namespace Drupal\farmos_asset_link\EventSubscriber;

use Drupal\Core\Routing\RouteSubscriberBase;
use Symfony\Component\Routing\RouteCollection;

/**
 * Alter routes for the farmos_asset_link module.
 */
class RouteSubscriber extends RouteSubscriberBase {

  /**
   * {@inheritdoc}
   */
  public function alterRoutes(RouteCollection $collection) {

    if ($route = $collection->get('entity.asset_link_default_plugin.delete_form')) {
      $route->setRequirement(
        '_asset_link_default_plugin_delete_access',
        'Drupal\farmos_asset_link\Access\AssetLinkDefaultPluginDeletableAccessCheck::access');
    }

  }

}
