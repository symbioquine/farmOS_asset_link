import { uuidv4 } from "assetlink-plugin-api";

export const FARM_URL = new URL("https://farm.example.com:1234/farmos");

/**
 * Generates the structural data based on the models.
 *
 * @implements {IStructuralDataPreloader}
 */
export default class ModelBasedStructuralDataPreloader {
  async load(assetLink) {
    const models = assetLink.cores.farmData.getEntityModelsSync();

    const hasCachedEntitiesOfType = (entityType, sortKey) =>
      assetLink.entitySource.cache.query((q) =>
        q.findRecords(entityType).sort(sortKey || "drupal_internal__id")
      ).length > 0;

    let assetTypes = [];
    if (!hasCachedEntitiesOfType("asset_type--asset_type")) {
      assetTypes = Object.keys(models)
        .filter((mk) => mk.startsWith("asset--"))
        .map((assetType) => {
          const assetTypeName = assetType.split("--")[1];
          const assetTypeId = uuidv4();
          const capitalizedAssetTypeName =
            assetTypeName[0].toUpperCase() + assetTypeName.slice(1);
          return {
            type: "asset_type--asset_type",
            id: assetTypeId,
            links: {
              self: {
                href: `${FARM_URL}/api/asset_type/asset_type/${assetTypeId}`,
              },
            },
            attributes: {
              langcode: "en",
              status: true,
              dependencies: {
                enforced: {
                  module: [`farm_${assetTypeName}`],
                },
              },
              drupal_internal__id: assetTypeName,
              label: capitalizedAssetTypeName,
              description: "",
              workflow: "asset_default",
              new_revision: true,
            },
          };
        });
    }

    let logTypes = [];
    if (!hasCachedEntitiesOfType("log_type--log_type")) {
      logTypes = Object.keys(models)
        .filter((mk) => mk.startsWith("log--"))
        .map((logType) => {
          const logTypeName = logType.split("--")[1];
          const logTypeId = uuidv4();
          const capitalizedLogTypeName =
            logTypeName[0].toUpperCase() + logTypeName.slice(1);
          return {
            type: "log_type--log_type",
            id: logTypeId,
            links: {
              self: {
                href: `${FARM_URL}/api/log_type/log_type/${logTypeId}`,
              },
            },
            attributes: {
              langcode: "en",
              status: true,
              dependencies: {
                enforced: {
                  module: [`farm_${logTypeName}`],
                },
              },
              drupal_internal__id: logTypeName,
              label: capitalizedLogTypeName,
              description: "",
              name_pattern: `${capitalizedLogTypeName} log [log:id]`,
              workflow: "log_default",
              new_revision: true,
            },
          };
        });
    }

    let taxonomyVocabs = [];
    if (
      !hasCachedEntitiesOfType(
        "taxonomy_vocabulary--taxonomy_vocabulary",
        "drupal_internal__vid"
      )
    ) {
      taxonomyVocabs = [
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "3c2bd9d0-a2db-4c5e-bf32-8bdd2dacc024",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/3c2bd9d0-a2db-4c5e-bf32-8bdd2dacc024`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_animal_type"],
              },
            },
            name: "Animal types",
            drupal_internal__vid: "animal_type",
            description: "A list of animal species/breeds.",
            weight: 0,
          },
        },
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "60d0a771-589d-498b-8a4e-94d12507c004",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/60d0a771-589d-498b-8a4e-94d12507c004`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_plant_type"],
              },
            },
            name: "Crop family",
            drupal_internal__vid: "crop_family",
            description: "A list of crop families.",
            weight: 0,
          },
        },
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "3f7e4c4a-d558-4686-9597-ae4180aeea59",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/3f7e4c4a-d558-4686-9597-ae4180aeea59`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_log_category"],
              },
            },
            name: "Log categories",
            drupal_internal__vid: "log_category",
            description: "A list of log categories.",
            weight: 0,
          },
        },
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "3250c0dc-cfda-46be-bf22-fb7abe357824",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/3250c0dc-cfda-46be-bf22-fb7abe357824`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_material_type"],
              },
            },
            name: "Material types",
            drupal_internal__vid: "material_type",
            description: "A list of material types.",
            weight: 0,
          },
        },
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "4d3147b7-d195-4689-8c65-ea81d56a285e",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/4d3147b7-d195-4689-8c65-ea81d56a285e`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_plant_type"],
              },
            },
            name: "Plant types",
            drupal_internal__vid: "plant_type",
            description: "A list of crops/varieties.",
            weight: 0,
          },
        },
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "4a989e19-8b72-41d4-a782-3496a356c574",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/4a989e19-8b72-41d4-a782-3496a356c574`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_season"],
              },
            },
            name: "Seasons",
            drupal_internal__vid: "season",
            description: "A list of seasons.",
            weight: 0,
          },
        },
        {
          type: "taxonomy_vocabulary--taxonomy_vocabulary",
          id: "5a05c608-211f-47b8-a44f-4d910edbdc31",
          links: {
            self: {
              href: `${FARM_URL}/api/taxonomy_vocabulary/taxonomy_vocabulary/5a05c608-211f-47b8-a44f-4d910edbdc31`,
            },
          },
          attributes: {
            langcode: "en",
            status: true,
            dependencies: {
              enforced: {
                module: ["farm_unit"],
              },
            },
            name: "Units",
            drupal_internal__vid: "unit",
            description: "A list of units for measurement purposes.",
            weight: 0,
          },
        },
      ];
    }

    if (assetTypes.length || logTypes.length || taxonomyVocabs.length) {
      await assetLink.entitySource.update(
        (t) => [
          ...assetTypes.map((assetType) => t.addRecord(assetType)),
          ...logTypes.map((logType) => t.addRecord(logType)),
          ...taxonomyVocabs.map((taxonomyVocab) => t.addRecord(taxonomyVocab)),
        ],
        { localOnly: true }
      );
    }
  }
}
