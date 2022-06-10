<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Config\Entity\ConfigEntityListBuilder;
use Drupal\Core\Entity\EntityInterface;

/**
 * Provides a listing of the default Asset Link plugin urls.
 */
class AssetLinkDefaultPluginListBuilder extends ConfigEntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function buildHeader() {
    $header['url'] = $this->t('URL');
    $header['status'] = $this->t('Status');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    $row['url'] = $entity->url();
    $row['status'] = $entity->status() ? $this->t('Enabled') : $this->t('Disabled');

    return $row + parent::buildRow($entity);
  }

  /**
   * {@inheritdoc}
   */
  public function getDefaultOperations(EntityInterface $entity) {
    $operations = parent::getDefaultOperations($entity);

    // Remove the 'edit' operation since it effectively only
    // allows enabling/disabling/deleting which we're providing
    // separate buttons for.
    unset($operations['edit']);

    // Only allow deleting user-defined default plugins
    if (!$entity->userDefined()) {
      unset($operations['delete']);
    }

    // Add AJAX functionality to enable/disable operations.
    foreach (['enable', 'disable'] as $op) {
      if (isset($operations[$op])) {
        $operations[$op]['url'] = $entity->toUrl($op);
        // Enable and disable operations should use AJAX.
        $operations[$op]['attributes']['class'][] = 'use-ajax';
      }
    }

    // We assign data-drupal-selector to every link, so it focuses on the edit
    // link after the ajax response. By default ajax.js would focus on the same
    // button again, but the enable/disable buttons will be hidden.
    // @see ViewsListBuilder::getDefaultOperations()
    foreach ($operations as &$operation) {
      $operation['attributes']['data-drupal-selector'] = 'asset-link-default-plugin-listing-' . $entity->id();
    }

    return $operations;
  }

    /**
   * {@inheritdoc}
   */
  public function render() {
    $list = parent::render();

    // Add a custom ID to the table so it can be replaced via an AJAX command
    $list['#type'] = 'container';
    $list['#attributes']['id'] = 'asset-link-default-plugin-entity-list';

    return $list;
  }

}
