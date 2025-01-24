/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "uimodule/model/models",
        "uimodule/services/services",
        "uimodule/services/psda_operations",
        "uimodule/services/cda_operations",
        "uimodule/services/ia_operations",
        "uimodule/services/da_operations"
    ],
    function (UIComponent, Device, models, Services, PSDA_operations, CDA_operations, IA_operations, DA_operations) {
        "use strict";

        return UIComponent.extend("uimodule.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                // Inicializar Servicios
                this.initServices();
            },

            initServices: function () {
                // Implementación de servicios
                const oManifest = this.getManifestObject();
                const urlCatalog = oManifest.resolveUri("catalog");
                const urlWF = oManifest.resolveUri("bpmworkflowruntime");
                const urlDMS = oManifest.resolveUri("dms");
                Services.setUrl(urlCatalog, urlWF, urlDMS);
                PSDA_operations.setUrl(urlCatalog, urlWF, urlDMS );
                CDA_operations.setUrl(urlCatalog, urlWF, urlDMS );
                IA_operations.setUrl(urlCatalog, urlWF, urlDMS );
                DA_operations.setUrl(urlCatalog, urlWF, urlDMS);
            }
        });
    }
);