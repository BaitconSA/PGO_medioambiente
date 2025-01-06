sap.ui.define([
    "./BaseController",
    "uimodule/utils/utils",
    "uimodule/model/modelConfig",
    "uimodule/model/permissionRolesApp",
    "uimodule/services/services",
    "uimodule/js/TablePsdaFunction"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Utils, ModelConfig, PermissionUser, Services, TablePsdaFunction) {
        "use strict";

        return Controller.extend("uimodule.controller.MainView", {
            onInit: function () {
                this.getRouter().getRoute("MainView").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function (oEvent) {
                this._oMainModel = ModelConfig.createMainModel();
                this.getView().setModel( this._oMainModel, "mainModel" );

                const sObraID = this.getOwnerComponent().getComponentData()?.startupParameters.ID || ["79bc29e7-4ddd-4cb6-a73a-fb0137e0338d"];
                
                this._loadData( sObraID );   
            },

            _loadData: async function ( obraID ) {
                // Preload
                Utils.dialogBusy(true);

                try {
                    // Verificar si la aplicación se está ejecutando en localhost
                     const isLocalhost = window.location.hostname === "localhost";
                     let oUserData, oUserRolesData; 
                     
                     if (isLocalhost) {
                        // Lógica para LOCAL TESTING
                        oUserRolesData = { value: ["PGO_Inspector"] };
                        oUserData = { "Nombre": "gustavo.quintana@datco.net" };
                      } else {

                        try {
                            // Lógica para DEPLOY
                            const oUser = Services.getUser();
                            const oUserRoles = Services.getUserRoles();
                            [oUserData, oUserRolesData] = await Promise.all([oUser, oUserRoles]);
                        } catch (e) {
                            Utils.showMessage("Error al obtener datos de usuario o roles", "Error", "WARNING");
                        }
                    }

                    // Validar que los datos de usuario están presentes y continuar el flujo
                    if (!oUserData) {
                        Utils.showMessage("Datos de usuario incompletos o no encontrados.", "Advertencia", "WARNING");
                    }

                    if (!oUserRolesData ) {
                        Utils.showMessage("Roles de usuario incompletos o no encontrados.", "Advertencia", "WARNING");
                    }
                     // Obtener datos de la obra
                    let oObraData = {};
                    try {
                        oObraData = await Services.getObraData( obraID );
                        // Armo los P3 / PI / Información necesaria de la Obra.
                     this._oMainModel = ModelConfig.createStructuredModel( this._oMainModel, oObraData, oUserData, oUserRolesData );
                        //Permisos del Usuario para Ejecutar la App
                     const oPermissions =  PermissionUser.evaluateUserPermissions( oUserRolesData );
                     this._oMainModel.setProperty("/Permissions", oPermissions);

                    // Verificar permisos
                    if (this.checkPermissions(oPermissions)) {
                        Utils.showMessage("No tiene permisos para ejecutar esta aplicación.", "Advertencia", "WARNING");
                    } else {
                        console.log("El usuario tiene permisos para ejecutar esta aplicación.");
                    }
                     const sKey = this._oMainModel.getProperty("/Section/sP3IDDefault");
                     this._buildIconTabByP3(null, sKey);
                    } catch (e) {
                        Utils.showMessage("Error al obtener datos de la obra", "Error", "WARNING");
                    }
                    
                     // Validar que los datos de la obra están presentes
                    if ( !oObraData ) {
                        throw new Error("Datos de obra incompletos o no encontrados.");
                    } else {
                    Utils.showMessage("Datos cargados exitosamente", "Éxito", "SUCCESS");
                }

                    
                } catch (error) {
                    Utils.showMessage("Error al cargar los datos", "Error", "ERROR");
                } finally { 
                     Utils.dialogBusy(false);
                }
            },

            checkPermissions: function (oPermissions) {
                // Verificar si todas las propiedades son false
                return Object.values(oPermissions).every(permission => !permission);
            },
            

            _buildIconTabByP3: function (oEvent, sKey) {
                // Lógica para construir el IconTab por el P3
                if (!oEvent && !sKey) {
                    console.error("No existe P3");
                    return;
                    }
    
                const oP3List = this._oMainModel.getProperty("/Section/aP3List");
    
                    // Crea una instancia del Icon Tab Bar
                const iconTabBar = this.getView().byId("IconTabP3_ID");
                        iconTabBar.removeAllItems();
    
                // Crea pestañas dinámicas (por ejemplo, desde un modelo de datos)
                const aItems = iconTabBar.getItems();
    
                if (aItems.length === 0) {
                    oP3List.forEach((P3Row) => {
                    const tabFilter = new sap.m.IconTabFilter({
                        text: `${P3Row.codigo} - ${P3Row.nombre}`,
                        key: P3Row.ID
                    });
                    iconTabBar.addItem(tabFilter);
                    });
                }
    
                if (sKey !== null) {
                    this._setIconTabsP3( null, sKey );
                } else {
                    this._clearTableMain();
                }
            },

            _setIconTabsP3: function (oEvent , sP3id ) {
              const oView = this.getView();
              this._oMainModel = ModelConfig.buildHeaderInfo(oView, oEvent, this._oMainModel, sP3id);
                
            },

            _clearTableMain: function () {
                this._oMainModel.setProperty("/TableData", []);
                this._oMainModel.setProperty("/Preload/IsLoading", false);
            },

            onUploadManualDataPSDA: function (oEvent) {
                const oController = this; 
                const oModel = this.getView().getModel("mainModel");
                TablePsdaFunction.onAddManualRow( this.getView(), oController, oModel);
            },

            onCancelPress: function () {
                this.getView().byId("dialogUploadPSDA").close();
            },

            onInputLiveChange: function (oEvent) {
               const oModel = this.getView().getModel("mainModel");
               TablePsdaFunction.onInputLiveChange( oEvent, oModel, oEvent.getSource().getId() );
            },

            onValidateDate: function (oEvent) {
               TablePsdaFunction.onValidateDate( oEvent );
            },

            onValidateMonthYear: function (oEvent) {
               TablePsdaFunction.onValidateMonthYear( oEvent );
            },

            onAddYear: function (oEvent) {
                const oModel = this.getView().getModel("mainModel");
                TablePsdaFunction.onAddYearRow( oModel );
            },
    

            onSend: function (oEvent) {
                const oModel = this.getView().getModel("mainModel");
                console.log(oModel);
            
                // Mostrar confirmación
                sap.m.MessageBox.confirm(
                    "Todos los registros en estado borrador pasarán a pendientes de inspección.",
                    {
                        title: "Confirmación",
                        actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.OK],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                // Acción a realizar si se presiona "Aceptar"
                                this._proceedWithSending();
                            }
                        }.bind(this)
                    }
                );
            },
            
            // Función para proceder con el envío
            _proceedWithSending: function () {
                const oModel = this.getView().getModel("mainModel");
                // Aquí puedes añadir el código para proceder con el envío.
                console.log("Envío confirmado", oModel);
            }
            

        });
    });
