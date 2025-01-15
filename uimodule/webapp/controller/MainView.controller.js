sap.ui.define([
    "./BaseController",
    "uimodule/utils/utils",
    "uimodule/model/modelConfig",
    "uimodule/model/permissionRolesApp",
    "uimodule/services/services",
    "uimodule/services/psda_operations",
    "uimodule/js/TablePsdaFunction",
    "uimodule/js/TableCDAFunction",
    "uimodule/js/TableIAFunction",
    "uimodule/js/TableDAFunction",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Utils, ModelConfig, PermissionUser, Services, PSDA_operations, TablePsdaFunction, TableCDAFunction, TableIAFunction, TableDAFunction, MessageBox, MessageToast) {
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
                    let oView = this.getView();
                    try {
                        const oObra = Services.getObraData(obraID);
                        const oInformes = PSDA_operations.getInformes(); // Consulto los informes en su archivo correspondiente 
                        const [oObraData, oInformesData] = await Promise.all([oObra, oInformes]);
                    
                        // Armo los P3 / PI / Información necesaria de la Obra.
                        this._oMainModel = ModelConfig.createStructuredModel(oView, this._oMainModel, oObraData, oInformesData, oUserData, oUserRolesData);
                    
                        // Permisos del Usuario para Ejecutar la App
                        const oPermissions = PermissionUser.evaluateUserPermissions(oUserRolesData);
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
                  //  Utils.showMessage("Datos cargados exitosamente", "Éxito", "SUCCESS");
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

            onOpenDialog: function (oEvent) {
                const sParam = oEvent.getSource().data("param");
                const oController = this; 
                const oModel = this.getView().getModel("mainModel");
                if( sParam === "PSDA" ) {
                    TablePsdaFunction.onAddManualRow( this.getView(), oController, oModel );
                } else if ( sParam === "CDA" ) {
                    TableCDAFunction.onOpenDialogCDA( this.getView(), oController, oModel );
                } else if ( sParam === "IA" ) {
                    TableIAFunction.onOpenDialogIA( this.getView(), oController, oModel );
                } else {
                    TableDAFunction.onOpenDialogDA( this.getView(), oController, oModel );
                }
                
            },

            // Seleccionar PSDA desde el dialog
            onFileUploaderChange: function(oEvent) {
                const oModel = this.getView().getModel("mainModel");
                TablePsdaFunction.onFileUploaderChange( oEvent, this.getView(), oModel );
            },

            // Seleccion Archivo Adjunto CDA
            onSelectFile: function (oEvent) {
              const oView = this.getView();
              const oModel = oView.getModel("mainModel");
              TableCDAFunction.onSelectFile( this.getView(), oEvent, oModel );
            },

            // Seleccion Archivo Adjunto IA
            onSelectFileIA: function (oEvent) {
                const oView = this.getView();
                const oModel = oView.getModel("mainModel");
                TableIAFunction.onSelectFile( this.getView(), oEvent, oModel );
              },

            onCancelDialog: function () {
                this._formatDialogData("CDA");
                // Ocultar el MessageStrip al cerrar el diálogo
                this.byId("messageStripCDA").setVisible(false);
                // Cerrar el diálogo sin guardar
                this.byId("addDocumentationDialog").close();
                this.byId("addDocumentationDialog").destroy();
            },

            onCancelDialogIA: function () {
                this._formatDialogData("IA");
                // Ocultar el MessageStrip al cerrar el diálogo
                this.byId("messageStripIA").setVisible(false);
                // Cerrar el diálogo sin guardar
                this.byId("addDocumentationIADialog").close();
                this.byId("addDocumentationIADialog").destroy();
            },

            _formatDialogData: function ( typedialog ) {
                const oModel = this.getView().getModel("mainModel");
                if( typedialog === "CDA" ) {
                    this.getView().byId("fileUploaderCDA").setValue("");
                          oModel.setProperty("/DatosFormularioCDA/payload/FechaDeteccion", null);
                          oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/File", {} );
                          oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/FileName", null );
                } else if (typedialog === "IA") { 
                    this.getView().byId("fileUploaderIA").setValue("");
                          oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/File", {} );
                          oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/FileName", null );
                }
                
            },

            //Dialogo Orden de Notas en PSDA
            onOpenDialogOrderNotes: function () {
                const oController = this;
                const oModel = this.getView().getModel("mainModel");
                TablePsdaFunction.onOpenDialogOrderNotes( this.getView(), oModel, oController );
            },

            onConfirmDialogOrderNotes: function ( oEvent ) {
                const oModel = this.getView().getModel("mainModel");
                TablePsdaFunction.onConfirmDialogOrderNotes( oEvent, oModel )
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

            onCancelPress: function () {
                this.getView().byId("dialogUploadPSDA").close();
                TablePsdaFunction._resetFileUploader( this.getView() );
            },

            onSavePSDA: function (oEvent, sAction) {
                // Busy ON
                Utils.dialogBusy(true);

                const oModel = this.getView().getModel("mainModel");
                // Lógica para guardar según la acción
                if (sAction === "Save") {
                    // Lógica para guardar
                    const sObraID = oModel.getProperty("/ObraID");
                    const sEnvironmentResponse = oModel.getProperty("/Payload/environmentalResponsive");
                    const fechaActual = new Date();
                    const mesActual = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
                    const sMesInformar = oModel.getProperty("/DatosFormularioPSDA/payload/mesAinformar");
                    const aOrderNotes = oModel.getProperty("/OrderNotesTableData");
                    const aUploadNotasPedido = aOrderNotes.map(item => ({ nota_pedido_ID: item.ID }));
                    const aUploadDocumentsPSDA = oModel.getProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion");
                    
                    if (aUploadDocumentsPSDA && Array.isArray(aUploadDocumentsPSDA) && aUploadDocumentsPSDA.length > 0) {
                        aUploadDocumentsPSDA.forEach(doc => {
                            delete doc.fechaAdjunto;
                        });
                    }
                    
                    
                    const invalidField = this._validateFields();

                    if (invalidField) { // Validación de campos obligatorios PSDA
                        let confirmMessage = this.getResourceBundle().getText("savePSDAConfirm");
                        MessageBox.confirm(confirmMessage, {
                            actions: [MessageBox.Action.CANCEL, "Aceptar"],
                            emphasizedAction: "Aceptar",
                            onClose: async (sAction) => {
                              if (sAction !== "Aceptar")
                                return;
                              try {
                                const oPayload = {
                                resposnable_ambiental: sEnvironmentResponse || "",
                                fecha_informada: null,
                                fecha_informar: null,
                                control: null,
                                informe_desempenio: [
                                    {
                                        informe: [{
                                            estado_ID: "BO",
                                            mes: parseInt(mesActual),
                                            sMesInformar: sMesInformar,
                                            desempenio_nota_pedido: aUploadNotasPedido, // Coleccion de notas de pedido
                                            PSDA_firmada_nombre: aUploadDocumentsPSDA[0]?.PSDA_firmada_nombre,
                                            PSDA_firmada_ruta: aUploadDocumentsPSDA[0]?.PSDA_firmada_ruta,
                                            PSDA_firmada_formato: aUploadDocumentsPSDA[0]?.PSDA_firmada_formato
                                          }]
                                        }
                                    ]
                                }
                                
                                const oNewPsdaDocument = await PSDA_operations.onCreatePsdaDocument(oPayload, this.getView());
                                
                                // Guardamos el ID de la entidad 'Padre'
                                oModel.setProperty("/IDMainEntity", oNewPsdaDocument.ID );
                                oModel.setProperty("/DatosFormularioPSDA/TablePSDA/Data", oNewPsdaDocument );
                                
                                this.onCancelPress(); // Cierro el dialogo y vuelvo a cargar información de la App
                                this._loadData( sObraID );
                              } catch (error) {
                                const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                                MessageToast.show(errorMessage);
                              } finally {
                                Utils.dialogBusy(false);
                              }
                            }
                          });

                    } 
                 
                    // --- FIN Lógica para guardar ---
                } else if (sAction === "Send") {
                    // Lógica para guardar y enviar
                    console.log(sAction)
                }
                
                Utils.dialogBusy(false);
            },

            onViewDetails: function ( oEvent ) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
                TablePsdaFunction.onViewDetails( oView , oController, oEvent, oModel);
            },

            onSendPSDA: async function ( oEvent ) {
                Utils.dialogBusy(true);
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                // Usar desestructuración para acceder directamente al informe
                const { informe_desempenio: [{ informe }] } = oSelectedRow;

                let informeSeleccionado = informe[0];
                let sEntity = "InformesDesempenioAmbiental";

                const aOperation = await PSDA_operations.onSendPSDA( sEntity, informeSeleccionado.ID );
                console.log(aOperation)
                

                },  

            onCloseDialogPsdaDetail: function () {
                this.getView().byId("detailsPSDADialog").close();
            },

            _validateFields: function () {
                const oModel = this.getView().getModel("mainModel");
                const sMesInformar = oModel.getProperty("/DatosFormularioPSDA/payload/mesAinformar");
                const sEnvironmentResponse = oModel.getProperty("/Payload/environmentalResponsive");
                const aOrderNotesTableData = oModel.getProperty("/OrderNotesTableData");
                const aDocumentsPSDA = oModel.getProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion");


                let isValidate = true;

                if (sMesInformar === null || sMesInformar === undefined || sMesInformar.trim() === "") {
                    oModel.setProperty("/Validation/valueStateMesInformar", "Error");
                    oModel.setProperty("/Validation/valueStateTextMesInformar", "El campo mes a informar es Obligatorio.");
                    MessageBox.error("Verificar el campo Mes a Informar.")
                    isValidate = false;
                } else {
                     // El objeto no está vacío
                     oModel.setProperty("/Validation/valueStateMesInformar", "None");
                     oModel.setProperty("/Validation/valueStateTextMesInformar", "");
                }


                if (sEnvironmentResponse === null || sEnvironmentResponse === undefined || sEnvironmentResponse.trim() === "") {
                    oModel.setProperty("/Validation/environmentalResponsiveState", "Error");
                    oModel.setProperty("/Validation/valueStateTextEnvironmentalResponsive", "El campo Responsable Ambiental es Obligatorio.");
                    MessageBox.error("Verificar el campo Responsable Ambiental.")
                    isValidate = false;
                } else {
                     // El objeto no está vacío
                     oModel.setProperty("/Validation/environmentalResponsiveState", "None");
                     oModel.setProperty("/Validation/valueStateTextEnvironmentalResponsive", "");
                }


                if (!aOrderNotesTableData || aOrderNotesTableData.length === 0) {
                    MessageBox.error("Debe agregar al menos una nota de pedido antes de guardar.")
                    return;
                }

                if (!aDocumentsPSDA || Object.keys(aDocumentsPSDA).length === 0) {
                    // El objeto está vacío
                    oModel.setProperty("/DatosFormularioPSDA/payload/validation/documentPsdaValueState", "Error");
                    oModel.setProperty("/DatosFormularioPSDA/payload/validation/documentPsdaValueStateText", "Debe agregar al menos un documento.");
                    MessageBox.error("Falta adjuntar el documento PSDA firmado, favor verificar.")
                    isValidate = false;
                } else {
                    // El objeto no está vacío
                    oModel.setProperty("/DatosFormularioPSDA/payload/validation/documentPsdaValueState", "None");
                    oModel.setProperty("/DatosFormularioPSDA/payload/validation/documentPsdaValueStateText", "");
                }
                
                
                return isValidate;
            },  
            
            // Función para proceder con el envío
            _proceedWithSending: function () {
                const oModel = this.getView().getModel("mainModel");
                // Aquí puedes añadir el código para proceder con el envío.
                console.log("Envío confirmado", oModel);
            },

            onSaveDocumentCDA: function (oEvent) {
                const oModel = this.getView().getModel("mainModel");
                const oTableCDAData = oModel.getProperty("/DatosFormularioCDA/payload/TablaCDA");
                const oData = {
                    fechaDeteccion : oModel.getProperty("/DatosFormularioCDA/payload/FechaDeteccion"),
                    estado: "Borrador"
                };

                oTableCDAData.push(oData);
            },

            onSaveDocumentIA: function ( oEvent ) {
                console.log("LOGICA PARA GUARDADO DE ARCHIVO IA ")
            },

            onSaveDocumentDA: function( oEvent ) {
                const oModel = this.getView().getModel("mainModel");
                const isValidForm = TableDAFunction.validateForm( oModel );

                if( !isValidForm ){
                    return;
                }



            }
            

        });
    });
