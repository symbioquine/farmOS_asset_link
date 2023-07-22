<?php

namespace Drupal\farmos_asset_link\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Routing\RouteMatch;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Drupal\Component\Serialization\Json;

/**
 * Defines FarmAssetLinkModelsController class.
 */
class FarmAssetLinkModelsController extends ControllerBase {

  /**
   * {@inheritdoc}
   */
  public function Render() {
    $serverSchema = $this->loadPathAsJson('/api/schema');

    $models = [];

    foreach($serverSchema['allOf'] as $schemaRef) {
      if (!$schemaRef['links']) {
        continue;
      }

      foreach($schemaRef['links'] as $serverRelatedSchema) {
        $schemaUrl = is_array($serverRelatedSchema['targetSchema']) ? $serverRelatedSchema['targetSchema']['$ref'] : $serverRelatedSchema['targetSchema'];

        $relatedSchema = $this->loadPathAsJson($schemaUrl);

        $relatedItemSchema = $this->loadPathAsJson($relatedSchema['definitions']['data']['items']['$ref']);
  
        $typeName = $relatedItemSchema['definitions']['type']['const'];

        $model = [];

        $modelAttributes = [];

        foreach($relatedItemSchema['definitions']['attributes']['properties'] as $attrName => $attr) {
          if (!$attr) {
            continue;
          }

          // Orbit.js seems to only support 'number', not 'integer' but handles the former well enough
          if ($attr['type'] === 'integer') {
            $attr['type'] = 'number';
          }

          // https://www.drupal.org/project/jsonapi_schema/issues/3058850
          if ($attrName === 'third_party_settings') {
            $attr['type'] = 'object';
          }

          $modelAttributes[$attrName] = $attr;
        }

        $model['attributes'] = $modelAttributes;

        $modelRelationships = [];

        foreach($relatedItemSchema['definitions']['relationships']['properties'] as $attrName => $propSchema) {
          $propType = $propSchema['properties']['data']['type'] ?? '';

          // https://github.com/bradjones1/orbit-schema-from-openapi/blob/cde8d885152b3d88b9352669c97099ca1c13a2ff/index.js#L160-L172
          if ($propType === 'array') {
            $modelRelationships[$attrName] = [
              'kind' => 'hasMany',
              'type' => $propSchema['properties']['data']['items']['properties']['type']['enum'] ?? NULL,
            ];
          } else {
            $modelRelationships[$attrName] = [
              'kind' => 'hasOne',
              'type' => $propSchema['properties']['data']['properties']['type']['enum'] ?? NULL,
            ];
          }
        }

        $model['relationships'] = $modelRelationships;

        $models[$typeName] = $model;
      }
    }

    return new JsonResponse($models);
  }

  private function loadPathAsJson($path) {
    $httpKernel = \Drupal::service('http_kernel.basic');

    $subRequest = Request::create($path, 'GET');

    $subResponse = $httpKernel->handle($subRequest, HttpKernelInterface::SUB_REQUEST);
    $content = $subResponse->getContent();

    return Json::decode($content);
  }

}
