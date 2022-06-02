<?php

namespace Drupal\farmos_asset_link\Entity;

use Drupal\Core\Config\Entity\ConfigEntityBase;
use Drupal\Core\Config\Entity\ConfigEntityInterface;
use Drupal\Core\Entity\EntityWithPluginCollectionInterface;

/**
 * Defines the AssetLinkDefaultPlugin entity.
 *
 * @ConfigEntityType(
 *   id = "asset_link_default_plugin",
 *   module = "farmos_asset_link",
 *   label = @Translation("Asset Link default plugin"),
 *   label_collection = @Translation("Asset Link default plugins"),
 *   label_singular = @Translation("Asset Link default plugin"),
 *   label_plural = @Translation("Asset Link default plugins"),
 *   label_count = @PluralTranslation(
 *     singular = "@count Asset Link default plugin",
 *     plural = "@count Asset Link default plugins",
 *   ),
 *   handlers = {
 *     "list_builder" = "Drupal\farmos_asset_link\Controller\AssetLinkDefaultPluginListBuilder",
 *     "form" = {
 *       "add" = "Drupal\farmos_asset_link\Form\AssetLinkDefaultPluginForm",
 *       "edit" = "Drupal\farmos_asset_link\Form\AssetLinkDefaultPluginForm",
 *       "delete" = "Drupal\Core\Entity\EntityDeleteForm",
 *     },
 *     "permission_provider" = "\Drupal\entity\EntityPermissionProvider",
 *     "route_provider" = {
 *       "default" = "Drupal\entity\Routing\DefaultHtmlRouteProvider",
 *     },
 *   },
 *   config_prefix = "asset_link_default_plugin",
 *   admin_permission = "administer farm settings",
 *   entity_keys = {
 *     "id" = "id",
 *     "url" = "url",
 *     "user_defined" = "user_defined",
 *     "status" = "status",
 *   },
 *   config_export = {
 *     "id",
 *     "url",
 *     "user_defined",
 *     "status",
 *   },
 *   links = {
 *     "collection" = "/farm/settings/asset_link_default_plugin/list",
 *     "add-form" = "/farm/settings/asset_link_default_plugin/add",
 *     "edit-form" = "/farm/settings/asset_link_default_plugin/{asset_link_default_plugin}/edit",
 *     "delete-form" = "/farm/settings/asset_link_default_plugin/{asset_link_default_plugin}/delete",
 *     "enable" = "/farm/settings/asset_link_default_plugin/{asset_link_default_plugin}/enable",
 *     "disable" = "/farm/settings/asset_link_default_plugin/{asset_link_default_plugin}/disable",
 *   }
 * )
 */
class AssetLinkDefaultPlugin extends ConfigEntityBase implements ConfigEntityInterface {

  /**
   * The plugin id.
   *
   * @var string
   */
  protected $id;

  /**
   * The plugin URL.
   *
   * @var string
   */
  protected $url;

  /**
   * The plugin status.
   *
   * @var bool
   */
  protected $status;

  /**
   * Whether the plugin was user defined - as opposed to
   * provided by a farmOS module.
   *
   * @var bool
   */
  protected $user_defined;

  /**
   * {@inheritdoc}
   */
  public function id() {
    return $this->id;
  }

  /**
   * {@inheritdoc}
   */
  public function label() {
    return $this->url();
  }

  /**
   * {@inheritdoc}
   */
  public function setId($id) {
    $this->id = $id;
  }

  /**
   * {@inheritdoc}
   */
  public function url() {
    return $this->url;
  }

  /**
   * {@inheritdoc}
   */
  public function userDefined() {
    return $this->user_defined;
  }

  /**
   * {@inheritdoc}
   */
  public function setUserDefined($user_defined) {
    $this->user_defined = $user_defined;
  }

}


