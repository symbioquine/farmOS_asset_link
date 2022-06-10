<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Controller\ControllerBase;
use Drupal\farmos_asset_link\Entity\AssetLinkDefaultPlugin;
use Symfony\Component\HttpFoundation\Request;

/**
 * Returns responses for notification UI routes.
 *
 * @see \Drupal\views_ui\Controller\ViewsUIController::ajaxOperation()
 */
class FarmAssetLinkDefaultPluginsUIController extends ControllerBase {

  /**
   * Calls a method on a data stream notification and reloads the listing page.
   *
   * @param \Drupal\farmos_asset_link\Entity\AssetLinkDefaultPlugin $data_stream_notification
   *   The default plugin config entity.
   * @param string $op
   *   The operation to perform, e.g., 'enable' or 'disable'.
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The current request.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse|\Symfony\Component\HttpFoundation\RedirectResponse
   *   Either returns a rebuilt listing page as an AJAX response, or redirects
   *   back to the listing page.
   */
  public function ajaxOperation(AssetLinkDefaultPlugin $asset_link_default_plugin, string $op, Request $request) {
    // Perform the operation.
    $asset_link_default_plugin->$op()->save();

    // If the request is via AJAX, return the rendered list as JSON.
    if ($request->request->get('js')) {
      $list = $this->entityTypeManager()
        ->getListBuilder('asset_link_default_plugin')
        ->render();
      $response = new AjaxResponse();
      $response->addCommand(new ReplaceCommand('#asset-link-default-plugin-entity-list', $list));
      return $response;
    }

    // Otherwise, redirect back to the listing page.
    return $this->redirect('entity.asset_link_default_plugin.collection');
  }

}
