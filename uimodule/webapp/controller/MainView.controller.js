sap.ui.define([
    "./BaseController",
    "uimodule/utils/utils",
    "uimodule/model/modelConfig",
    "uimodule/model/permissionRolesApp",
    "uimodule/services/services",
    "uimodule/services/psda_operations",
    "uimodule/services/cda_operations",
    "uimodule/services/ia_operations",
    "uimodule/services/da_operations",
    "uimodule/services/Approvers",
    "uimodule/js/TablePsdaFunction",
    "uimodule/js/TableCDAFunction",
    "uimodule/js/TableIAFunction",
    "uimodule/js/TableDAFunction",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "uimodule/model/formatter",
    "sap/ui/core/Fragment",
    "sap/ui/core/util/File",
    "sap/ui/model/Filter",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Utils, ModelConfig, PermissionUser, Services, PSDA_operations, CDA_operations, IA_operations, DA_operations, Approvers, TablePsdaFunction, TableCDAFunction, TableIAFunction, TableDAFunction, MessageBox, MessageToast, Formatter, Fragment, File, Filter) {
        "use strict";

        return Controller.extend("uimodule.controller.MainView", {
            formatter: Formatter,
            onInit: function () {
                this.getRouter().getRoute("MainView").attachPatternMatched(this._onObjectMatched, this);
                this._contextPath = null;
            },

            _onObjectMatched: function (oEvent) {
                this._oMainModel = ModelConfig.createMainModel();
                this.getView().setModel( this._oMainModel, "mainModel" );

                const sObraID = this.getOwnerComponent().getComponentData()?.startupParameters.ID || ["79bc29e7-4ddd-4cb6-a73a-fb0137e0338d"];
                
                this._loadData( sObraID );   
            },

            _loadData: async function (obraID) {        
                    // Obtener datos de la obra
                    Utils.dialogBusy(true);
                try {
                    // Verificar si la aplicación se está ejecutando en localhost
                    const isLocalhost = window.location.hostname === "localhost";
                    let oUserData, oUserRolesData;
            
                    if (isLocalhost) {
                        // Lógica para LOCAL TESTING
                      // oUserRolesData = { value: ["PGO_Inspector"] };
                        oUserRolesData = { value: ["PGO_Contratista"] };
                        oUserData = { "Nombre": "gustavo.quintana@datco.net" };
                    } else {
                        try {
                            Utils.dialogBusy(true);
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
                        return;
                    }
            
                    if (!oUserRolesData) {
                        Utils.showMessage("Roles de usuario incompletos o no encontrados.", "Advertencia", "WARNING");
                        return;
                    }
                    

                    const oModel = this.getView().getModel("mainModel");
                    const oObra = Services.getObraData(obraID);
                    const oResponsableAmbiental = Services.getResponsableAmbiental();
                    const oUsuarios = Services.getUsuariosEstructuraOrganizativa(); // Obtengo el usuario medioAmbiente
                    const oInformes = PSDA_operations.getInformes(); // Obtengo Informes Planilla de seguimiento desempeño Ambiental
                    const oControlesDesvios = CDA_operations.getControles(); // Obtengo Controles de desvíos ambientales
                    const oInformesAmbientales = IA_operations.getInformes(); // Obtengo Información de documentos de Informes Ambientales
                    const oDocumentacionAdicional = DA_operations.getDocumentos(); // Obtengo Información de documentos adicionales
                    
                    oModel.refresh(true);
                    const [oObraData, oResponsableAmbientalData, oUsuariosMedioAmbienteData, oInformesData, oControlesData, oInformesAmbientalesData, oDocumentacionAdicionalData] = await Promise.all([
                        oObra, oResponsableAmbiental, oUsuarios, oInformes, oControlesDesvios, oInformesAmbientales, oDocumentacionAdicional
                    ]);

                    if (oResponsableAmbientalData && oResponsableAmbientalData.value && oResponsableAmbientalData.value.length !== 0) {
                        if (this._oMainModel) {
                            this._oMainModel.setProperty("/buttonCreate", false);
                            this._oMainModel.setProperty("/buttonEdit", true);
                        } else {
                            oModel.setProperty("/buttonCreate", false);
                            oModel.setProperty("/buttonEdit", true);
                        }
                    } else {
                        if (this._oMainModel) {
                            this._oMainModel.setProperty("/buttonCreate", true);
                            this._oMainModel.setProperty("/buttonEdit", false);
                        } else {
                            oModel.setProperty("/buttonCreate", true);
                            oModel.setProperty("/buttonEdit", false);
                        }
                    }
                    
            
                    // Validar que los datos de la obra están presentes
                    if (!oObraData) {
                        throw new Error("Datos de obra incompletos o no encontrados.");
                    }

                      // Permisos del Usuario para Ejecutar la App
                      const oPermissions = PermissionUser._evaluatePermissionsForSections(oInformesData, oControlesData,oInformesAmbientalesData,oDocumentacionAdicionalData, oUserRolesData);
            
                    // Armo los P3 / PI / Información necesaria de la Obra.
                    this._oMainModel = ModelConfig.createStructuredModel(
                        this.getView(), oModel, oObraData, oResponsableAmbientalData,
                        oPermissions.oInformesData, oPermissions.oControlesData, oPermissions.oInformesAmbientalesData, oPermissions.oDocumentacionAdicionalData, oUserData, oUserRolesData
                    );
                    
                  
                    this._oMainModel.setProperty("/Permissions", oPermissions);
                    this._oMainModel.setProperty("/UsuariosMedioAmbientes", oUsuariosMedioAmbienteData.value );
        
                    const sKey = this._oMainModel.getProperty("/Section/sP3IDDefault");
                    this._buildIconTabByP3(null, sKey);
                } catch (e) {
                    Utils.showMessage("Error al obtener datos de la obra", "Error", "WARNING");
                } finally {
                }
            },
            

            _buildIconTabByP3: async function (oEvent, sKey) {
                const oModel = this.getModel("mainModel");
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
                    await Approvers.loadAprrovers( oModel );  
                } else {
                    this._clearTableMain();
                }
            },

            _setIconTabsP3: function (oEvent , sP3id ) {
              const oView = this.getView();
              this._oMainModel = ModelConfig.buildHeaderInfo(oView, oEvent, this._oMainModel, sP3id);
              Utils.dialogBusy(false);
            },

            _clearTableMain: function () {
                this._oMainModel.setProperty("/TableData", []);
                this._oMainModel.setProperty("/Preload/IsLoading", false);
            },

            onSaveEnvironmentalResponsive: function ( oEvent ) {
                // Obtener el valor del Input dentro del Popover
                const sEnvironmentalResponsive = sap.ui.getCore().byId("newNameEnvironmental").getValue();

                 // Validación de campos obligatorios
                if (!sEnvironmentalResponsive) {
                    Utils.showMessage("El campo de responsable ambiental no puede estar vacío.", "Error", "WARNING");
                    return;
                }

            
                // Validación de campos obligatorios
                let confirmMessage = this.getResourceBundle().getText("createEnvironmentalReponse");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") return;
                        try {
                            const oPayload = {
                                responsable_ambiental: sEnvironmentalResponsive
                            };
                            
                            const oNewEnvironmentalResponsive = await Services.onCreateEnvironmentalResponsive(oPayload, this.getView());
                            console.log(oNewEnvironmentalResponsive);
                            
                            this.onClosePopoverCreate(); // Cierra el popover
                            this._onObjectMatched(); // Recarga los datos
                        } catch (error) {
                            const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                            MessageToast.show(errorMessage);
                        } finally {
                            Utils.dialogBusy(false);
                        }
                    }
                });
            },            

            onChangeEnvironmentalResponsive: function (oEvent) {
                const oModel = this.getModel("mainModel");
                // Obtener el nuevo valor del Input dentro del Popover
                const sUpdatedEnvironmentalResponsive = sap.ui.getCore().byId("popoverInput").getValue();

                 // Validación de campos obligatorios
                 if (!sUpdatedEnvironmentalResponsive) {
                    Utils.showMessage("El campo de responsable ambiental no puede estar vacío.", "Error", "WARNING");
                    return;
                }
                
                // Validación de campos obligatorios
                let confirmMessage = this.getResourceBundle().getText("editEnvironmentalReponse");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") return;
                        
                        try {
                            Utils.dialogBusy(true);
                            
                            // Obtener el ID del responsable ambiental actual
                            const oResponsableAmbientalData = oModel.getProperty("/ResponsableAmbiental");
                            if (!oResponsableAmbientalData) {
                                throw new Error("No hay un responsable ambiental registrado para editar.");
                            }
                            
                            const sID = oResponsableAmbientalData.ID;
                            
                            // Crear payload para actualización
                            const oPayload = {
                                responsable_ambiental: sUpdatedEnvironmentalResponsive
                            };
                            
                            // Llamar al servicio PATCH para actualizar el dato existente
                            await Services.onUpdateEnvironmentalResponsive(sID, oPayload, this.getView());
                            
                            // Cierra el popover
                            this.onClosePopoverChange();
                            
                            // Recarga los datos
                            this._onObjectMatched();
                            
                        } catch (error) {
                            const errorMessage = this.getResourceBundle().getText("errorEditADS");
                            MessageToast.show(errorMessage);
                        } finally {
                            Utils.dialogBusy(false);
                        }
                    }
                });
            },

            onClosePopoverCreate: function () {
                var oPopover = this.getView().byId("createPopover");
                if (oPopover) {
                    oPopover.close();
                } else {
                    console.log("Popover no encontrado");
                }
            },

            onClosePopoverChange: function () {
                var oPopover = this.getView().byId("editPopover");
                if (oPopover) {
                    oPopover.close();
                } else {
                    console.log("Popover no encontrado");
                }
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

            onFileUploaderChange: function(oEvent, sParam) {
                const oModel = this.getView().getModel("mainModel");
            
                switch (sParam) {
                    case "documentPSDA_edit":
                        // Sección Desempeño Ambiental (Edición Documento)
                        TablePsdaFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Edit");
                        break;
            
                    case "documentCDA_create":
                        // Sección Control Desvios Ambientales (Subida -> Documento)
                        TableCDAFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Create");
                        break;
            
                    case "documentCDA_edit":
                        // Sección Control Desvios Ambientales (Edición -> Documento)
                        TableCDAFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Edit");
                        break;
            
                    case "documentIA_create":
                        // Sección Informes Ambientales (Creación -> Documento)
                        TableIAFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Create");
                        break; 
                    case "documentIA_edit":
                        // Sección Informes Ambientales (Creación -> Documento)
                        TableIAFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Edit");
                        break; 
                    case "documentDA_create":
                        // Sección Informes Ambientales (Creación -> Documento)
                        TableDAFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Create");
                        break;
                    case "documentDA_edit":
                        // Sección Informes Ambientales (Creación -> Documento)
                        TableDAFunction.onFileUploaderChange(oEvent, this.getView(), oModel, "Edit");
                        break; documentDA_edit
                    default:
                        // Sección Desempeño Ambiental (Subida Documento)
                        TablePsdaFunction.onFileUploaderChange(oEvent, this.getView(), oModel);
                        break; 
                }
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

              onCancelDialogCDA: function () {
                this._formatDialogData("CDA");
                // Ocultar el MessageStrip al cerrar el diálogo
                this.byId("messageStripCDA").setVisible(false);
                // Cerrar el diálogo sin guardar
                this.byId("dialogUploadCDA").close();
                this.byId("dialogUploadCDA").destroy();
            },

            onCancelDialogIA: function () {
                this._formatDialogData("IA");
                // Ocultar el MessageStrip al cerrar el diálogo
                this.byId("messageStripIA").setVisible(false);
                // Cerrar el diálogo sin guardar
                this.byId("dialogUploadIA").close();
                this.byId("dialogUploadIA").destroy();
            },

            onCancelDialogDA: function () {
                this._formatDialogData("DA");
                // Ocultar el MessageStrip al cerrar el diálogo
                this.byId("messageStripDA").setVisible(false);
                // Cerrar el diálogo sin guardar
                this.byId("dialogUploadDA").close();
                this.byId("dialogUploadDA").destroy();
            },

            _formatDialogData: function (typedialog) {
                const oModel = this.getView().getModel("mainModel");
                
                switch(typedialog) {
                    case "CDA":
                        this.getView().byId("fileUploaderCDA").setValue("");
                        oModel.setProperty("/DatosFormularioCDA/payload/FechaDeteccion", null);
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/File", {});
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/FileName", null);
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documentAttachmentData", []);
                        
                        // Saco el valueState
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/dateOfDetectionValueState", null);
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/dateOfDetectionTextValueState", null);
                        break;
                    
                    case "IA":
                        this.getView().byId("fileUploaderIA").setValue("");
                        oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/File", {});
                        oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/FileName", null);
                        oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documentAttachmentData", []);
                        break;
                    
                    case "EditPSDA":
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/documento/DocumentacionAdicional", {});
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/documento/File", {});
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/documento/FileName", null);
                        break;
                    
                    case "DA":
                        this.getView().byId("fileUploaderDA").setValue("");
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcion", null);
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/comentarios", null);
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/File", {});
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/FileName", null);
                        
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionValueState", "None");
                        oModel.setProperty("/DatosFormularioDA/EditSection/payload/uploadDA/descripcionStateText", "");
                        break;
                    
                    case "EditDA":
                        // Formateo formulario Edición
                        this.getView().byId("fileUploaderDAedit").setValue("");
                        oModel.setProperty("/DatosFormularioDA/EditSection/descripcion", null);
                        oModel.setProperty("/DatosFormularioDA/EditSection/comentarios", null);
                        oModel.setProperty("/DatosFormularioDA/EditSection/documento/File", {});
                        oModel.setProperty("/DatosFormularioDA/EditSection/documento/FileName", null);
                        
                        oModel.setProperty("/DatosFormularioDA/EditSection/validation/descripcionValueState", "None");
                        oModel.setProperty("/DatosFormularioDA/EditSection/validation/descripcionStateText", "");
                        break;
                    
                    default:
                        console.warn("Typedialog no reconocido: " + typedialog);
                }
            },
            

            //Dialogo Orden de Notas en PSDA
            onOpenDialogOrderNotes: function (oEvent, sParam) {
                if (sParam === "Edit") {
                    const oController = this;
                    const oModel = this.getView().getModel("mainModel");
                    TablePsdaFunction.onOpenDialogOrderNotes( this.getView(), oModel, oController, "Edit" );
                } else {
                    const oController = this;
                    const oModel = this.getView().getModel("mainModel");
                    TablePsdaFunction.onOpenDialogOrderNotes( this.getView(), oModel, oController );
                }
            },

            onDeleteOrderNotes: function ( oEvent, sParam ) {
                    const deleteRecord = oEvent.getSource().getBindingContext("mainModel").getObject(),
                    oModel = this.getView().getModel("mainModel"),
                    aData = sParam === "Edit" ? oModel.getProperty("/OrderNotesTableEditData/nota_pedido") : oModel.getProperty("/OrderNotesTableData");
                    for (let i = 0; i < aData.length; i++) {
                    if (aData[i] === deleteRecord) {
                        aData.splice(i, 1);
                        oModel.refresh();
                        break;
                    }
                 }
            },

            onConfirmDialogOrderNotes: function ( oEvent, sParam ) {
                if (sParam === "Edit" ) {
                    const oModel = this.getView().getModel("mainModel");
                    TablePsdaFunction.onConfirmDialogOrderNotes( oEvent, oModel, "Edit" )
                } else {
                    const oModel = this.getView().getModel("mainModel");
                    TablePsdaFunction.onConfirmDialogOrderNotes( oEvent, oModel )
                }
              
            },

            onInputLiveChange: function (oEvent) {
               const oModel = this.getView().getModel("mainModel");
               TablePsdaFunction.onInputLiveChange( oEvent, oModel, oEvent.getSource().getId() );
            },

            onOpenCreateEnvironmental: function (oEvent) {
            
                if (!this._oCreatePopover) {
                    Fragment.load({
                        name: "uimodule.view.environmentalResponse.environmentalCreate",
                        controller: this
                    }).then(function (oPopover) {
                        this._oCreatePopover = oPopover;
                        this.getView().addDependent(this._oCreatePopover);
                        this._oCreatePopover.openBy(oEvent.getSource());
                    }.bind(this));
                } else {
                    this._oCreatePopover.openBy(oEvent.getSource());
                }
            },
            
            onEditEnvironmentalResponsive: function (oEvent) {
                var oInput = this.byId("inputField");
                var sValue = oInput.getValue();
            
                if (!this._oEditPopover) {
                    Fragment.load({
                        name: "uimodule.view.environmentalResponse.environmentalResponse",
                        controller: this
                    }).then(function (oPopover) {
                        this._oEditPopover = oPopover;
                        this.getView().addDependent(this._oEditPopover);
                        this._oEditPopover.openBy(oEvent.getSource());
                    }.bind(this));
                } else {
                    this._oEditPopover.openBy(oEvent.getSource());
                }
            },            

            onCancelPress: function (sParam) {
                const oView = this.getView();
                
                const actionMapping = {
                    "saveDialogCDA": () => {
                        oView.byId("dialogUploadCDA").close();
                        TableCDAFunction._resetFileUploader(oView, "Create");
                    },
                    "editDialogCDA": () => {
                        oView.byId("editDialogCDA").close();
                        TableCDAFunction._resetFileUploader(oView, "Edit");
                    },
                    "saveDialogIA": () => {
                        oView.byId("dialogUploadIA").close();
                        TableIAFunction._resetFileUploader(oView, "Create");
                    },
                    "editDialogIA": () => {
                        oView.byId("editDialogIA").close();
                        TableIAFunction._resetFileUploader(oView, "Edit");
                    },
                    "dialogUploadDA": () => {
                        oView.byId("dialogUploadDA").close();
                        TableDAFunction._resetFileUploader(oView, "Create");
                    },
                    
                };
            
                if (actionMapping[sParam]) {
                    actionMapping[sParam]();
                } else {
                    oView.byId("dialogUploadPSDA").close();
                    TablePsdaFunction._resetFileUploader(oView);
                }
            },
            

            onSavePSDA: function (oEvent, sAction) {
                // Busy ON
                Utils.dialogBusy(true);

                const oModel = this.getView().getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const sP3Codigo = oModel.getProperty("/HeaderInfo/p3");
                const sRegistroProveedor = oModel.getProperty("/HeaderInfo/supplierRegistration");
                const fechaActual = new Date();
                const mesActual = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
                // Lógica para guardar según la acción
                if (sAction === "Save" || sAction === "Send") {
                    // Lógica para guardar
                    const sMesInformar = oModel.getProperty("/DatosFormularioPSDA/payload/mesAinformar");
                    const aOrderNotes = oModel.getProperty("/OrderNotesTableData");
                    const aUploadNotasPedido = aOrderNotes.map(item => ({ nota_pedido_ID: item.ID }));
                    const aUploadDocumentsPSDA = oModel.getProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion");
                    
                    if (aUploadDocumentsPSDA && Array.isArray(aUploadDocumentsPSDA) && aUploadDocumentsPSDA.length > 0) {
                        aUploadDocumentsPSDA.forEach(doc => {
                            delete doc.fechaAdjunto;
                        });
                    }
                    
                    const invalidField = this._validateFields("Save");

                    if (invalidField) { // Validación de campos obligatorios PSDA
                        let confirmMessage = this.getResourceBundle().getText("savePSDAConfirm");
                        MessageBox.confirm(confirmMessage, {
                            actions: [MessageBox.Action.CANCEL, "Aceptar"],
                            emphasizedAction: "Aceptar",
                            onClose: async (sAction) => {
                              if (sAction !== "Aceptar"){
                                Utils.dialogBusy(false);
                                return;
                              }
                              try {
                                const oPayload = {
                                    estado_ID: sAction === "Save" ? "BO" : "PI",
                                    mes: parseInt(mesActual),
                                    mes_informar: sMesInformar,
                                    desempenio_nota_pedido: aUploadNotasPedido, // Coleccion de notas de pedido
                                    PSDA_firmada_nombre: aUploadDocumentsPSDA[0]?.PSDA_firmada_nombre,
                                    PSDA_firmada_ruta: aUploadDocumentsPSDA[0]?.PSDA_firmada_ruta,
                                    PSDA_firmada_formato: aUploadDocumentsPSDA[0]?.PSDA_firmada_formato
                                }
                                
                                const oNewPsdaDocument = await PSDA_operations.onCreatePsdaDocument(oPayload, this.getView());

                                // SE COMENTA PARA TESTING   
                                await PSDA_operations.createFolderDMS(sObraID, sRegistroProveedor, sP3Codigo);
                               
                                const sFolder = "Planilla Seguimiento Desempenio Ambiental";
                                   /* -- Post información adjunto al servicio -- */
                                aUploadDocumentsPSDA.forEach(doc => {
                                    PSDA_operations.postDMSFile( doc, sObraID , sRegistroProveedor, sP3Codigo, sFolder );
                                });

                                this.onCancelPress("EditDialog"); // Cierro el dialogo y vuelvo a cargar información de la App
                              } catch (error) {
                                const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                                MessageToast.show(errorMessage);
                              } finally {
                                Utils.dialogBusy(false);
                                this._loadData( sObraID );
                              }
                            }
                          });

                    } 
                 
                    // --- FIN Lógica para guardar ---
                } else if (sAction === "SaveEdition") {
                    // Lógica para Editar y Guardar
                    const IDdesempenioAmbiental = oModel.getProperty("/DatosFormularioPSDA/EditSection/selectedRow/ID");
                    const aOrderNotes = oModel.getProperty("/OrderNotesTableEditData/nota_pedido");
                    const aUploadNotasPedido = aOrderNotes.map(item => ({ nota_pedido_ID: item.ID }));
                    const sMesInformar = oModel.getProperty("/DatosFormularioPSDA/EditSection/mesInformar");
                    const oDocument = oModel.getProperty("/DatosFormularioPSDA/EditSection/documentAttachmentData");

                    const invalidField = this._validateFields("SaveEdition");
                    
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
                                    estado_ID: "BO",
                                    mes: parseInt(mesActual),
                                    mes_informar: sMesInformar,
                                    desempenio_nota_pedido: aUploadNotasPedido, // Coleccion de notas de pedido
                                    PSDA_firmada_nombre: oDocument[0]?.documentoNombre,
                                    PSDA_firmada_ruta: oDocument[0]?.documentoRuta,
                                    PSDA_firmada_formato: oDocument[0]?.documentoFormato        
                                };
                                
                                const oNewPsdaDocument = await PSDA_operations.onUpdatePsdaDocument(IDdesempenioAmbiental, oPayload, this.getView());
                                
                                this.onCloseDialogPsdaEdit()// Cierro el dialogo y vuelvo a cargar información de la App

                                this._loadData( sObraID );
                              } catch (error) {
                                Utils.dialogBusy(false);
                                const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                                MessageToast.show(errorMessage);
                              } finally {
                                Utils.dialogBusy(false);
                              }
                            }
                          });

                    } 
                    
                }
                
                Utils.dialogBusy(false);
            },

            onDeletePsdaDocument: function (oEvent) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
            
                const sObraID = oModel.getProperty("/ObraID");
            
                // Llamar a la función que muestra el cuadro de confirmación y maneja la eliminación
                TablePsdaFunction._handleDeletePsdaDocument(oEvent, oView, oModel, oController)
                    .then(() => this._loadData(sObraID))
                    .catch(error => console.error("Error al eliminar el documento:", error));
            },

            onViewDetails: function ( oEvent, sAction ) {
                if ( sAction === "documentPSDA_details" ) {
                    const oView = this.getView();
                    const oModel = this.getModel("mainModel");
                    const oController = this;
                    TablePsdaFunction.onViewDetails( oView , oController, oEvent, oModel);
                } else if ( sAction === "documentCDA_details" ) {
                    const oView = this.getView();
                    const oModel = this.getModel("mainModel");
                    const oController = this;
                    TableCDAFunction.onViewDetails( oView , oController, oEvent, oModel);
                } else if ( sAction === "documentIA_details") {
                    const oView = this.getView();
                    const oModel = this.getModel("mainModel");
                    const oController = this;
                    TableIAFunction.onViewDetails( oView , oController, oEvent, oModel);
                } else if ( sAction === "documentDA_details") {
                    const oView = this.getView();
                    const oModel = this.getModel("mainModel");
                    const oController = this;
                    TableDAFunction.onViewDetails( oView , oController, oEvent, oModel);
                }
               
            },
             // Formateador de mes
            onFormatMonth: function(monthNumber) {
            const months = [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];

            return months[monthNumber - 1] || "Mes inválido";
        },

            onEditPSDA: function ( oEvent ) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
                TablePsdaFunction.onEdit( oView , oController, oEvent, oModel);
            },

            // || --> Edit / Delete CDA || <--
            onEditCDA: function ( oEvent ) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
                TableCDAFunction.onEdit( oView , oController, oEvent, oModel);
            },

            onDeleteCdaDocument: function (oEvent) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
            
                const sObraID = oModel.getProperty("/ObraID");
            
                // Llamar a la función que muestra el cuadro de confirmación y maneja la eliminación
                TableCDAFunction._handleDeleteCdaDocument(oEvent, oView, oModel, oController)
                    .then(() => this._loadData(sObraID))
                    .catch(error => console.error("Error al eliminar el documento:", error));
            },
            // || --> FIN Edit / Delete CDA || <--

            // || -->  Edit / Delete IA || <--
            onEditIA: function ( oEvent ) { 
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
                TableIAFunction.onEdit( oView , oController, oEvent, oModel);
            },

            onDeleteIaDocument: function (oEvent) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
            
                const sObraID = oModel.getProperty("/ObraID");
            
                // Llamar a la función que muestra el cuadro de confirmación y maneja la eliminación
                TableIAFunction._handleDeleteIaDocument(oEvent, oView, oModel, oController)
                    .then(() => this._loadData(sObraID))
                    .catch(error => console.error("Error al eliminar el documento:", error));
            },
             // || --> FIN Edit / Delete IA || <--


            onEditDA: function ( oEvent ) { 
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
                TableDAFunction.onEdit( oView , oController, oEvent, oModel);
            },

            onDeleteDaDocument: function (oEvent) {
                const oView = this.getView();
                const oModel = this.getModel("mainModel");
                const oController = this;
            
                const sObraID = oModel.getProperty("/ObraID");
            
                // Llamar a la función que muestra el cuadro de confirmación y maneja la eliminación
                TableDAFunction._handleDeleteDaDocument(oEvent, oView, oModel, oController)
                    .then(() => this._loadData(sObraID))
                    .catch(error => console.error("Error al eliminar el documento:", error));
            },

            // -----> ||  OPERACIONES PSDA  || <-----
            onSendPSDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const oObraData = oModel.getData();
                const sObraID = oModel.getProperty("/ObraID");
                // Supongamos que este es tu array original
                const responsables = this.getModel("mainModel").getProperty("/Responsables").inspectores;

                // Extraemos las propiedades "inspector" en un nuevo array
                const aInspectores = responsables.map(objeto => objeto.inspector).map( inspector => inspector.correo);;


                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                let sEntity = "InformesDesempenioAmbiental";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendPSDAConfirm");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            const oNumeroPlanilla = await PSDA_operations.onSendPSDA(sEntity, oSelectedRow.ID);
                            console.log(oNumeroPlanilla);
                            
                            const oDataDocument = await PSDA_operations.getLastDocument(oSelectedRow.ID); // Asegurarse de usar await si es una función asincrónica
                                  oDataDocument.nombreObra = oObraData["ObraData"].nombre;
                             // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                             const sSectionTab = "Planilla Seguimiento Desempenio Ambiental"
                             await PSDA_operations._sendWorkflowNotification(sSectionTab, oDataDocument, aInspectores, "SendToApprove");
                        } catch (error) {
                            console.error("Error al enviar el documento:", error);
                            Utils.showMessage("Error al enviar el documento PSDA", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData(sObraID); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }                        
                });
            },

            onApprovePSDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                 // Lista de Usuarios Medio Ambiente Al aprobar
                 const aResponsablesMediAmbiente = this.getModel("mainModel").getProperty("/UsuariosMedioAmbientes").map( responsable =>  responsable.usuario);
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "InformesDesempenioAmbiental";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendAprovePsda");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await PSDA_operations.onAprovePSDA(sEntity, oSelectedRow.ID);
                
                            const sSectionTab = "Planilla de Seguimiento Desempeño Ambiental";
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await PSDA_operations._sendWorkflowNotification( sSectionTab, oSelectedRow, aResponsablesMediAmbiente, "SendToApprove" );
                        } catch (error) {
                            console.error("Error al aprobar el documento:", error);
                            Utils.showMessage("Error al aprobar el documento PSDA", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData( sObraID ); 
                        }
                    }
                });
            },

            onRejectPSDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");
                const aContratistas = this.getModel("mainModel").getProperty("/ObraData/contratista").map( obj => { return obj.contratista});
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "InformesDesempenioAmbiental";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("rejectAprovePsda");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await PSDA_operations.onRejectPSDA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Planilla Seguimiento Desempeño Ambiental";
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await CDA_operations._sendWorkflowNotification( sSectionTab, oSelectedRow, aContratistas, "SendToReject" );
                        } catch (error) {
                            console.error("Error al rechazar el documento:", error);
                            Utils.showMessage("Error al rechazar el documento PSDA", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData( sObraID ); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

           // -----> || FIN OPERACIONES PSDA  || <-----   

            // -----> ||  OPERACIONES IA  || <-----
            onSendIA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const oObraData = oModel.getData();
                const sObraID = oModel.getProperty("/ObraID");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                // Supongamos que este es tu array original
                const responsables = this.getModel("mainModel").getProperty("/Responsables").inspectores;

                // Extraemos las propiedades "inspector" en un nuevo array
                const aInspectores = responsables.map(objeto => objeto.inspector).map( inspector => inspector.correo);
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                let sEntity = "InformesAmbientales";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendIAConfirm");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            const oNumPlanilla = await IA_operations.onSendIA(sEntity, oSelectedRow.ID);

                            const oDataDocument = await CDA_operations.getLastDocument( oSelectedRow.ID ); // Asegurarse de usar await si es una función asincrónica
                            oDataDocument.nombreObra = oObraData["ObraData"].nombre;
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            const sSectionTab = "Informes Ambientales"

                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await IA_operations._sendWorkflowNotification( sSectionTab, oDataDocument, aInspectores, "SendToApprove" );
                            
                            
                        } catch (error) {
                            console.error("Error al enviar el documento:", error);
                            Utils.showMessage("Error al enviar el documento Informe Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData(sObraID); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

            onApproveIA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                 // Lista de Usuarios Medio Ambiente Al aprobar
                 const aResponsablesMediAmbiente = this.getModel("mainModel").getProperty("/UsuariosMedioAmbientes").map( responsable =>  responsable.usuario);
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "InformesAmbientales";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendAproveIA");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                        
                            await IA_operations.onAproveIA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Informes Ambientales";
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await CDA_operations._sendWorkflowNotification( sSectionTab, oSelectedRow, aResponsablesMediAmbiente, "SendToApprove" );
                           
            
                        } catch (error) {
                            console.error("Error al aprobar el documento:", error);
                            Utils.showMessage("Error al aprobar el documento Informe Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData( sObraID ); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

            onRejectIA: async function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getBindingContext("mainModel");
                
                // Almacenar el contexto en una propiedad del controlador
                 this._contextPath = oContext.getPath();

                if (!this._oPopover) {
                    Fragment.load({
                        name: "uimodule.view.informeAmbiental.RejectDocument",
                        controller: this
                    }).then(function (oPopover) {
                        this._oPopover = oPopover;
                        this.getView().addDependent(this._oPopover);
            
            
                        this._oPopover.openBy(oButton);
                    }.bind(this));
                } else {
            
                    this._oPopover.openBy(oButton);
                }
            }, 
            
            onSaveJustificationRejectIA: function (oEvent) {
                const sContextPath = this._contextPath; // Obtener la ruta del contexto almacenado en la propiedad del controlador
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                const aContratistas = this.getModel("mainModel").getProperty("/ObraData/contratista").map( obj => { return obj.contratista});
            
                // Verificar que obtenemos la ruta del contexto correctamente
                if (!sContextPath) {
                    console.error("No se pudo obtener la ruta del contexto de la fila seleccionada.");
                    return;
                }
            
                let oSelectedRow = oModel.getProperty(sContextPath);
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "InformesAmbientales";
                let sObservaciones = sap.ui.getCore().byId("popoverInputRejectIA").getValue();

                // Verificar que el TextArea no esté vacío
                if (!sObservaciones || sObservaciones.trim() === "") {
                    Utils.showMessage("La Observación no puede estar vacía.", "Advertencia", "WARNING");
                    return;
                }
            
                // Guardamos la justificación en el modelo
                oModel.setProperty(sContextPath + "/observaciones", sObservaciones);
            
                let confirmMessage = this.getResourceBundle().getText("rejectAproveIa");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await IA_operations.onUpdateIaDocument(oSelectedRow.ID, { observaciones: oSelectedRow.observaciones }, this.getView());
                            await IA_operations.onRejectIA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Informes Ambientales"
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await IA_operations._sendWorkflowNotification(sSectionTab, oSelectedRow, aContratistas, "SendToReject");
                           
                        } catch (error) {
                            console.error("Error al rechazar el documento:", error);
                            Utils.showMessage("Error al rechazar el documento Control Desvío Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData(sObraID); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },
            
            // -----> || FIN OPERACIONES IA  || <-----



             // -----> ||  OPERACIONES CDA  || <-----
            onSendCDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const oObraData = oModel.getData();
                const sObraID = oModel.getProperty("/ObraID");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                // Supongamos que este es tu array original
                const responsables = this.getModel("mainModel").getProperty("/Responsables").inspectores;

                // Extraemos las propiedades "inspector" en un nuevo array
                const aInspectores = responsables.map(objeto => objeto.inspector).map( inspector => inspector.correo);
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                let sEntity = "ControlesDesviosAmbientales";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendCDAConfirm");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            const oNumPlanilla = await CDA_operations.onSendCDA(sEntity, oSelectedRow.ID);

                            const oDataDocument = await CDA_operations.getLastDocument( oSelectedRow.ID ); // Asegurarse de usar await si es una función asincrónica
                                  oDataDocument.nombreObra = oObraData["ObraData"].nombre;
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            const sSectionTab = "Control Desvios Ambientales"
                             // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                             await CDA_operations._sendWorkflowNotification(sSectionTab, oDataDocument, aInspectores, "SendToApprove");
                           
            
                        } catch (error) {
                            console.error("Error al enviar el documento:", error);
                            Utils.showMessage("Error al enviar el documento Control Desvío Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData(sObraID); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

            onRejectCDA: async function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getBindingContext("mainModel");
                
                // Almacenar el contexto en una propiedad del controlador
                 this._contextPath = oContext.getPath();

                if (!this._oPopover) {
                    Fragment.load({
                        name: "uimodule.view.controlDesviosAmbientales.RejectDocument",
                        controller: this
                    }).then(function (oPopover) {
                        this._oPopover = oPopover;
                        this.getView().addDependent(this._oPopover);
            
            
                        this._oPopover.openBy(oButton);
                    }.bind(this));
                } else {
            
                    this._oPopover.openBy(oButton);
                }
            },
            
            onSaveJustificationRejectCDA: function (oEvent) {
                const sContextPath = this._contextPath; // Obtener la ruta del contexto almacenado en la propiedad del controlador
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                const aContratistas = this.getModel("mainModel").getProperty("/ObraData/contratista").map( obj => { return obj.contratista});
            
                // Verificar que obtenemos la ruta del contexto correctamente
                if (!sContextPath) {
                    console.error("No se pudo obtener la ruta del contexto de la fila seleccionada.");
                    return;
                }
            
                let oSelectedRow = oModel.getProperty(sContextPath);
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "ControlesDesviosAmbientales";
                let sObservaciones = sap.ui.getCore().byId("popoverInputRejectCDA").getValue();

                // Verificar que el TextArea no esté vacío
                if (!sObservaciones || sObservaciones.trim() === "") {
                    Utils.showMessage("La Observación no puede estar vacía.", "Advertencia", "WARNING");
                    return;
                }
            
                // Guardamos la justificación en el modelo
                oModel.setProperty(sContextPath + "/observaciones", sObservaciones);
            
                let confirmMessage = this.getResourceBundle().getText("rejectAproveCda");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await CDA_operations.onUpdateCdaDocument(oSelectedRow.ID, { observaciones: oSelectedRow.observaciones }, this.getView());
                            await CDA_operations.onRejectCDA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Control Desvios Ambientales"
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await CDA_operations._sendWorkflowNotification(sSectionTab, oSelectedRow, aContratistas, "SendToReject");
                           
                        } catch (error) {
                            console.error("Error al rechazar el documento:", error);
                            Utils.showMessage("Error al rechazar el documento Control Desvío Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData(sObraID); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

            onApproveCDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                 // Lista de Usuarios Medio Ambiente Al aprobar
                 const aResponsablesMediAmbiente = this.getModel("mainModel").getProperty("/UsuariosMedioAmbientes").map( responsable =>  responsable.usuario);
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "ControlesDesviosAmbientales";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendAproveCDA");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await CDA_operations.onAproveCDA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Controles Desvíos Ambientales";
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await CDA_operations._sendWorkflowNotification( sSectionTab, oSelectedRow, aResponsablesMediAmbiente, "SendToApprove" );
            
                        } catch (error) {
                            console.error("Error al aprobar el documento:", error);
                            Utils.showMessage("Error al aprobar el documento Informe Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData( sObraID ); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

          

             // -----> ||  OPERACIONES DA  || <-----
            onSendDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const oObraData = oModel.getData();
                const sObraID = oModel.getProperty("/ObraID");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");
                
                // Supongamos que este es tu array original
                const responsables = this.getModel("mainModel").getProperty("/Responsables").inspectores;

                // Extraemos las propiedades "inspector" en un nuevo array
                const aInspectores = responsables.map(objeto => objeto.inspector).map( inspector => inspector.correo);

                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                let sEntity = "DocumentacionAdicionalDesempenio";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendDAConfirm");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            const oNumPlanilla = await DA_operations.onSendDA(sEntity, oSelectedRow.ID);
                           
                            const oDataDocument = await CDA_operations.getLastDocument( oSelectedRow.ID ); // Asegurarse de usar await si es una función asincrónica
                                  oDataDocument.nombreObra = oObraData["ObraData"].nombre;
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            const sSectionTab = "Documentos Adicionales";
                             // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                             await DA_operations._sendWorkflowNotification(sSectionTab, oDataDocument, aInspectores, "SendToApprove");
            
                        } catch (error) {
                            console.error("Error al enviar el documento:", error);
                            Utils.showMessage("Error al enviar el documento Control Desvío Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData( sObraID ); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },

            onApproveDA: async function (oEvent) {
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");

                 // Lista de Usuarios Medio Ambiente Al aprobar
                 const aResponsablesMediAmbiente = this.getModel("mainModel").getProperty("/UsuariosMedioAmbientes").map( responsable =>  responsable.usuario);
            
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "DocumentacionAdicionalDesempenio";
            
                // Confirmación antes de enviar
                let confirmMessage = this.getResourceBundle().getText("sendAproveDA");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await DA_operations.onAproveDA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Documentos Adicionales"
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await DA_operations._sendWorkflowNotification(sSectionTab, oSelectedRow, aResponsablesMediAmbiente, "SendToApprove");
            
                        } catch (error) {
                            console.error("Error al aprobar el documento:", error);
                            Utils.showMessage("Error al aprobar el documento Informe Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData( sObraID ); 
                        }
                    }
                });
            },

            onRejectDA: async function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getBindingContext("mainModel");
                
                // Almacenar el contexto en una propiedad del controlador
                 this._contextPath = oContext.getPath();

                if (!this._oPopover) {
                    Fragment.load({
                        name: "uimodule.view.documentoAdicional.RejectDocument",
                        controller: this
                    }).then(function (oPopover) {
                        this._oPopover = oPopover;
                        this.getView().addDependent(this._oPopover);
            
            
                        this._oPopover.openBy(oButton);
                    }.bind(this));
                } else {
            
                    this._oPopover.openBy(oButton);
                }
            },
            
            onSaveJustificationRejectDA: function (oEvent) {
                const sContextPath = this._contextPath; // Obtener la ruta del contexto almacenado en la propiedad del controlador
                const oModel = this.getModel("mainModel");
                const sObraID = oModel.getProperty("/ObraID");
                const oObraData = oModel.getProperty("/ObraData");
                const aContratistas = this.getModel("mainModel").getProperty("/ObraData/contratista").map( obj => { return obj.contratista});
            
                // Verificar que obtenemos la ruta del contexto correctamente
                if (!sContextPath) {
                    console.error("No se pudo obtener la ruta del contexto de la fila seleccionada.");
                    return;
                }
            
                let oSelectedRow = oModel.getProperty(sContextPath);
                    oSelectedRow.nombreObra = oObraData.nombre;
                let sEntity = "DocumentacionAdicionalDesempenio";
                let sObservaciones = sap.ui.getCore().byId("popoverInputRejectDA").getValue();

                // Verificar que el TextArea no esté vacío
                if (!sObservaciones || sObservaciones.trim() === "") {
                    Utils.showMessage("La Observación no puede estar vacía.", "Advertencia", "WARNING");
                    return;
                }
            
                // Guardamos la justificación en el modelo
                oModel.setProperty(sContextPath + "/observaciones", sObservaciones);
            
                let confirmMessage = this.getResourceBundle().getText("rejectAproveDa");
                MessageBox.confirm(confirmMessage, {
                    actions: [MessageBox.Action.CANCEL, "Aceptar"],
                    emphasizedAction: "Aceptar",
                    onClose: async (sAction) => {
                        if (sAction !== "Aceptar") {
                            Utils.dialogBusy(false);
                            return;
                        }
            
                        Utils.dialogBusy(true);
            
                        try {
                            await DA_operations.onUpdateDaDocument(oSelectedRow.ID, { observaciones: oSelectedRow.observaciones }, this.getView());
                            await DA_operations.onRejectDA(sEntity, oSelectedRow.ID);

                            const sSectionTab = "Documentos Adicionales"
                            // Envío de Notificación de Workflow, aunque normalmente se haría solo tras éxito
                            await DA_operations._sendWorkflowNotification(sSectionTab, oSelectedRow, aContratistas, "SendToReject");
                           
                        } catch (error) {
                            console.error("Error al rechazar el documento:", error);
                            Utils.showMessage("Error al rechazar el documento Control Desvío Ambiental", "Error", "ERROR");
                        } finally {
                            Utils.dialogBusy(false); // Asegurarse de desactivar el Busy en el bloque finally
                            await this._loadData(sObraID); // Esperar hasta que los datos estén cargados antes de continuar
                        }
                    }
                });
            },
            // -----> || FIN OPERACIONES DA  || <-----

            onCloseDialogPsdaDetail: function () {
                this.getView().byId("detailsPSDADialog").close();
            },

            onCloseDialogPsdaEdit: function () {
                this._formatDialogData("EditPSDA");
                this.getView().byId("editPSDADialog").close();
                this.byId("editPSDADialog").destroy();
            },

            onCloseDialogDetailCDA: function () {
                this.getView().byId("detailCDADialog").close();
            },

            onCloseDialogCdaEdit: function () {
                this.getView().byId("editDialogCDA").close();
            },

            onCloseDialogDetailIA: function () {
                this.getView().byId("detailIADialog").close();
            },

            onCloseDialogIaEdit: function () {
                this.getView().byId("editDialogIA").close();
            },

            onCloseDialogDetailDA: function () {
                this.getView().byId("detailDADialog").close();
            },

            onCloseDialogDaEdit: function () {
                this._formatDialogData("EditDA");
                this.getView().byId("editDialogDA").close();
            },


            _validateFields: function ( sParam ) {
                let isValidate = true;
                const oModel = this.getView().getModel("mainModel");
                //Comienzo Validaciones para EDICIÓN
                if( sParam === "SaveEdition") {
                    const sMesInformar = oModel.getProperty("/DatosFormularioPSDA/EditSection/mesInformar");
                    const aOrderNotesTableData = oModel.getProperty("/OrderNotesTableEditData/nota_pedido");
                    const aDocumentPSDA = oModel.getProperty("/DatosFormularioPSDA/EditSection/documentAttachmentData");

                    if (sMesInformar === null || sMesInformar === undefined || sMesInformar.trim() === "") {
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/mesInformarValueState", "Error");
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/mesInformarTextValueState", "El campo mes a informar es Obligatorio.");
                        MessageBox.error("Verificar el campo Mes a Informar.")
                        isValidate = false;
                    } else {
                        // El objeto no está vacío
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/mesInformarValueState", "None");
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/mesInformarTextValueState", "");
                    }

                    if (!aOrderNotesTableData || aOrderNotesTableData.length === 0) {
                        MessageBox.error("Debe agregar al menos una nota de pedido antes de guardar.")
                        return;
                    }

                    if (!aDocumentPSDA || Object.keys(aDocumentPSDA).length === 0) {
                        // El objeto está vacío
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/documentPsdaEditValueState", "Error");
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/documentPsdaEditValueStateText", "Debe agregar al menos un documento.");
                        MessageBox.error("Falta adjuntar el documento PSDA firmado, favor verificar.")
                        isValidate = false;
                    } else {
                        // El objeto no está vacío
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/documentPsdaEditValueState", "None");
                        oModel.setProperty("/DatosFormularioPSDA/EditSection/validation/documentPsdaEditValueStateText", "");
                    }

                    //Fin Validaciones para EDICIÓN PSDA

                    
                } else if ( sParam === "documentCDA_create") {
                    //Comienzo Validaciones para CREACIÓN CDA
                    const sDateOfDetection = oModel.getProperty("/DatosFormularioCDA/payload/FechaDeteccion");
                    const aDocumentsCDA = oModel.getProperty("/DatosFormularioCDA/payload/uploadCDA/documento/DocumentacionAdicional");  

                    //Validacion Fecha Detecion
                    if (sDateOfDetection === null || sDateOfDetection === undefined || sDateOfDetection.trim() === "") {
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/dateOfDetectionValueState", "Error");
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/dateOfDetectionTextValueState", "El campo Fecha Detección es Obligatorio.");
                        MessageBox.error("Verificar el campo Fecha de Detacción.")
                        isValidate = false;
                    } else {
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/dateOfDetectionValueState", "None");
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/dateOfDetectionTextValueState", "");
                    }

                    //Validacion documento CDA
                    if (!aDocumentsCDA || Object.keys(aDocumentsCDA).length === 0) {
                        // El objeto está vacío
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaValueState", "Error");
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaEditValueStateText", "Debe agregar al menos un documento.");
                        MessageBox.error("Falta adjuntar el documento de Control Desvío, favor verificar.")
                        isValidate = false;
                    } else {
                        // El objeto no está vacío
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaValueState", "None");
                        oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaEditValueStateText", "");
                    }



                } else if ( sParam === "documentCDA_save" ) {
                      //Comienzo Validaciones para CREACIÓN CDA
                      const sDateOfDetection = oModel.getProperty("/DatosFormularioCDA/EditSection/selectedRow/formattedFechaDeteccion");
                      const aDocumentsCDA = oModel.getProperty("/DatosFormularioCDA/EditSection/documento/DocumentacionAdicional");  
  
                      //Validacion Fecha Detecion
                      if (sDateOfDetection === null || sDateOfDetection === undefined || sDateOfDetection.trim() === "") {
                          oModel.setProperty("/DatosFormularioCDA/EditSection/validation/dateOfDetectionValueState", "Error");
                          oModel.setProperty("/DatosFormularioCDA/EditSection/validation/dateOfDetectionTextValueState", "El campo Fecha Detección es Obligatorio.");
                          MessageBox.error("Verificar el campo Fecha de Detacción.")
                          isValidate = false;
                      } else {
                          oModel.setProperty("/DatosFormularioCDA/EditSection/validation/dateOfDetectionValueState", "None");
                          oModel.setProperty("/DatosFormularioCDA/EditSection/validation/dateOfDetectionTextValueState", "");
                      }
  
                      //Validacion documento CDA
                      if (!aDocumentsCDA || Object.keys(aDocumentsCDA).length === 0) {
                          // El objeto está vacío
                          oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaValueState", "Error");
                          oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaEditValueStateText", "Debe agregar al menos un documento.");
                          MessageBox.error("Falta adjuntar el documento de Control Desvío, favor verificar.")
                          isValidate = false;
                      } else {
                          // El objeto no está vacío
                          oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaValueState", "None");
                          oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/validation/documentCdaEditValueStateText", "");
                      }
                } else if ( sParam === "documentIA_create") {
                    const oDocumentIA = oModel.getProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional");
                    
                    //Validacion documento IA
                    if (!oDocumentIA || Object.keys(oDocumentIA).length === 0) {
                        // El objeto está vacío
                        oModel.setProperty("/DatosFormularioIA/payload/uploadCDA/validation/documentIaValueState", "Error");
                        oModel.setProperty("/DatosFormularioIA/payload/uploadCDA/validation/documentIaEditValueStateText", "Debe agregar al menos un documento.");
                        MessageBox.error("Falta adjuntar el documento de Informe Ambiental, favor verificar.")
                        isValidate = false;
                    } else {
                        // El objeto no está vacío
                        oModel.setProperty("/DatosFormularioIA/payload/uploadCDA/validation/documentIaValueState", "None");
                        oModel.setProperty("/DatosFormularioIA/payload/uploadCDA/validation/documentIaEditValueStateText", "");
                    }

                } else if ( sParam === "documentIA_save" ) {
                    const oDocumentIA = oModel.getProperty("/DatosFormularioIA/EditSection/documento/DocumentacionAdicional");
                    
                     //Validacion documento IA
                     if (!oDocumentIA || Object.keys(oDocumentIA).length === 0) {
                        // El objeto está vacío
                        oModel.setProperty("/DatosFormularioIA/EditSection/validation/documentIaValueState", "Error");
                        oModel.setProperty("/DatosFormularioIA/EditSection/validation/documentIaEditValueStateText", "Debe agregar al menos un documento.");
                        MessageBox.error("Falta adjuntar el documento de Informe Ambiental, favor verificar.")
                        isValidate = false;
                    } else {
                        // El objeto no está vacío
                        oModel.setProperty("/DatosFormularioIA/EditSection/validation/documentIaValueState", "None");
                        oModel.setProperty("/DatosFormularioIA/EditSection/validation/documentIaEditValueStateText", "");
                    }

                  
                } else if ( sParam === "documentDA_create") {
                    const sDescription = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/descripcion");
                    const oDocumentAdditional = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/documento/DocumentacionAdicional");
        
                    if (!sDescription || sDescription.trim() === "") {
                        isValidate = false;
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionValueState", "Error");
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionStateText", "La descripción no puede estar vacía.");
                        MessageBox.error("Falta completar la descripción, favor verificar.")
                    } else {
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionValueState", "None");
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionStateText", "");
                    }
                
                    if (!oDocumentAdditional || Object.keys(oDocumentAdditional).length === 0) {
                        isValidate = false;
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueState", "Error");
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueStateText", "El nombre del documento no puede estar vacío.");
                        MessageBox.error("Falta adjuntar el documento , favor verificar.")
                    } else {
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueState", "None");
                        oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueStateText", "");
                    }
        
                } else if ( sParam === "documentDA_edit") {
                    const sDescription = oModel.getProperty("/DatosFormularioDA/EditSection/descripcion");
                    const oDocumentAdditional = oModel.getProperty("/DatosFormularioDA/EditSection/documento/DocumentacionAdicional");
        
                    if (!sDescription || sDescription.trim() === "") {
                        isValidate = false;
                        oModel.setProperty("/DatosFormularioDA/EditSection/validation/descripcionValueState", "Error");
                        oModel.setProperty("/DatosFormularioDA/EditSection/validation/descripcionStateText", "La descripción no puede estar vacía.");
                        MessageBox.error("Falta completar la descripción, favor verificar.")
                    } else {
                        oModel.setProperty("/DatosFormularioDA/EditSection/validation/descripcionValueState", "None");
                        oModel.setProperty("/DatosFormularioDA/EditSection/validation/descripcionStateText", "");
                    }
                
                /*    if (!oDocumentAdditional || Object.keys(oDocumentAdditional).length === 0) {
                        isValidate = false;
                        oModel.setProperty("/DatosFormularioDA/EditSection/validate/documentDAValueState", "Error");
                        oModel.setProperty("/DatosFormularioDA/EditSection/validate/documentDAEditValueStateText", "El nombre del documento no puede estar vacío.");
                        MessageBox.error("Falta adjuntar el documento , favor verificar.")
                    } else {
                        oModel.setProperty("/DatosFormularioDA/EditSection/validate/documentDAValueState", "None");
                        oModel.setProperty("/DatosFormularioDA/EditSection/validate/documentDAEditValueStateText", "");
                    }*/
        
                } else {
                    //Comienzo Validaciones para CREACIÓN PSDA
                    const sMesInformar = oModel.getProperty("/DatosFormularioPSDA/payload/mesAinformar");
                    const sEnvironmentResponse = oModel.getProperty("/Payload/environmentalResponsive");
                    const aOrderNotesTableData = oModel.getProperty("/OrderNotesTableData");
                    const aDocumentsPSDA = oModel.getProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion");


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
                }
                
                
                
                return isValidate;
            },  
            
            // Función para proceder con el envío
            _proceedWithSending: function () {
                const oModel = this.getView().getModel("mainModel");
                // Aquí puedes añadir el código para proceder con el envío.
                console.log("Envío confirmado", oModel);
            },

            onSaveCDA: function (oEvent, sAction) {
               // Busy ON
               Utils.dialogBusy(true);

               const oModel = this.getView().getModel("mainModel");
               const sObraID = oModel.getProperty("/ObraID");
               const sP3Codigo = oModel.getProperty("/HeaderInfo/p3");
                const sRegistroProveedor = oModel.getProperty("/HeaderInfo/supplierRegistration");
               const IDdesempenioAmbiental = oModel.getProperty("/ResponsableAmbiental/ID");
               const sEnvironmentResponse = oModel.getProperty("/Payload/environmentalResponsive") || "Gustavo Quintana";
               const sDateOfDetection = oModel.getProperty("/DatosFormularioCDA/payload/uploadCDA/FechaDeteccion");
               const aUploadDocumentCDA = oModel.getProperty("/DatosFormularioCDA/payload/uploadCDA/documento/DocumentacionAdicional");
                   
                   if (aUploadDocumentCDA && Array.isArray(aUploadDocumentCDA) && aUploadDocumentCDA.length > 0) {
                    aUploadDocumentCDA.forEach(doc => {
                           delete doc.fechaAdjunto;
                       });
                   }
               const fechaActual = new Date();
               const mesActual = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
               // Lógica para guardar según la acción
               if (sAction === "documentCDA_create") {                   
                   const invalidField = this._validateFields("documentCDA_create");

                   if (invalidField) { // Validación de campos obligatorios PSDA
                       let confirmMessage = this.getResourceBundle().getText("saveDocumentCda");
                       MessageBox.confirm(confirmMessage, {
                        actions: [MessageBox.Action.CANCEL, "Aceptar"],
                        emphasizedAction: "Aceptar",
                        onClose: async (sAction) => {
                          if (sAction !== "Aceptar"){
                            Utils.dialogBusy(false);
                            return;
                          }
                             try {
                               const oPayload = {   
                                    desempenio_ID: IDdesempenioAmbiental,     
                                    fecha_deteccion:  sDateOfDetection,                          
                                    estado_ID: "BO",
                                    nombre_archivo: aUploadDocumentCDA[0]?.PSDA_firmada_nombre,
                                    ruta: aUploadDocumentCDA[0]?.PSDA_firmada_ruta,
                                    observaciones: null                              
                               }
                               
                               const oNewCdaDocument = await CDA_operations.onCreateCDADocument(oPayload, this.getView());

                                // SE COMENTA PARA TESTING   
                                await CDA_operations.createFolderDMS(sObraID, sRegistroProveedor, sP3Codigo);
                               
                                const sFolder = "Control Desvio Ambiental";
                                   /* -- Post información adjunto al servicio -- */
                                   aUploadDocumentCDA.forEach(doc => {
                                    CDA_operations.postDMSFile( doc, sObraID , sRegistroProveedor, sP3Codigo, sFolder );
                                });
                               
                               // ----> Cerrar dialogo "  -- Control Desvio Ambiental CDA --"
                               this.onCancelPress("saveDialogCDA"); // Cierro el dialogo y vuelvo a cargar información de la App
                            
                             } catch (error) {
                               const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                               MessageToast.show(errorMessage);
                             } finally {
                               Utils.dialogBusy(false);
                               this._loadData( sObraID );
                             }
                           }
                         });

                   } 

               } else {
                //  ----- > EDITAR Y GUARDAR EL -> 'CDA' -----
                const IDcontrolDesvio = oModel.getProperty("/DatosFormularioCDA/EditSection/selectedRow/ID"); 
                const sFechaDeteccion = oModel.getProperty("/DatosFormularioCDA/EditSection/selectedRow/formattedFechaDeteccion");
                const sFechaFormated = Utils.formatDate(sFechaDeteccion);
                const aDocumentacionCDA = oModel.getProperty("/DatosFormularioCDA/EditSection/documento/DocumentacionAdicional/Documentacion");
                const invalidField = this._validateFields("documentCDA_save");

                if (invalidField) { // Validación de campos obligatorios PSDA
                    let confirmMessage = this.getResourceBundle().getText("editDocumentCda");
                    MessageBox.confirm(confirmMessage, {
                        actions: [MessageBox.Action.CANCEL, "Aceptar"],
                        emphasizedAction: "Aceptar",
                        onClose: async (sAction) => {
                          if (sAction !== "Aceptar")
                            return;
                          try {
                            const oPayload = {   
                                 desempenio_ID: IDdesempenioAmbiental,     
                                 fecha_deteccion:  sFechaFormated,                          
                                 estado_ID: "BO",
                                 nombre_archivo: aDocumentacionCDA[0]?.PSDA_firmada_nombre,
                                 ruta: aDocumentacionCDA[0]?.PSDA_firmada_ruta,
                                 observaciones: null                              
                            }
                            
                            const oNewCdaDocument = await CDA_operations.onUpdateCdaDocument(IDcontrolDesvio, oPayload, this.getView());
                            
                            // ----> Cerrar dialogo "  -- Control Desvio Ambiental CDA --"
                            this.onCancelPress("editDialogCDA"); // Cierro el dialogo y vuelvo a cargar información de la App
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
               }
               
               Utils.dialogBusy(false);
            },
            

            onSaveIA: function ( oEvent, sAction ) {
                   // Busy ON
               Utils.dialogBusy(true);

               const oModel = this.getView().getModel("mainModel");
               const sP3Codigo = oModel.getProperty("/HeaderInfo/p3");
               const sRegistroProveedor = oModel.getProperty("/HeaderInfo/supplierRegistration");
               const sObraID = oModel.getProperty("/ObraID");
               const IDdesempenioAmbiental = oModel.getProperty("/ResponsableAmbiental/ID"); //  ---> ID Desempenio Ambiental
               const sEnvironmentResponse = oModel.getProperty("/Payload/environmentalResponsive") || "Gustavo Quintana";
               const aUploadDocumentIA = oModel.getProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional");
                   
                   if (aUploadDocumentIA && Array.isArray(aUploadDocumentIA) && aUploadDocumentIA.length > 0) {
                    aUploadDocumentIA.forEach(doc => {
                           delete doc.fechaAdjunto;
                       });
                   }
               const fechaActual = new Date();
               const mesActual = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
               // Lógica para guardar según la acción
               if (sAction === "documentIA_create") {                   
                   const invalidField = this._validateFields("documentIA_create");

                   if (invalidField) { // Validación de campos obligatorios PSDA
                       let confirmMessage = this.getResourceBundle().getText("saveDocumentIA");
                       MessageBox.confirm(confirmMessage, {
                        actions: [MessageBox.Action.CANCEL, "Aceptar"],
                        emphasizedAction: "Aceptar",
                        onClose: async (sAction) => {
                          if (sAction !== "Aceptar"){
                            Utils.dialogBusy(false);
                            return;
                          }
                             try {
                               const oPayload = {   
                                    desempenio_ID: IDdesempenioAmbiental,                            
                                    estado_ID: "BO",
                                    nombre_archivo: aUploadDocumentIA[0]?.PSDA_firmada_nombre,
                                    ruta: aUploadDocumentIA[0]?.PSDA_firmada_ruta,
                                    observaciones: null                              
                               }
                               
                               const oNewIaDocument = await IA_operations.onCreateIaDocument(oPayload, this.getView());

                                // SE COMENTA PARA TESTING   
                                await IA_operations.createFolderDMS(sObraID, sRegistroProveedor, sP3Codigo);
                                
                                const sFolder = "Informe Ambiental";
                                    /* -- Post información adjunto al servicio -- */
                                aUploadDocumentIA.forEach(doc => {
                                    IA_operations.postDMSFile( doc, sObraID , sRegistroProveedor, sP3Codigo, sFolder );
                                });
                               // ----> Cerrar dialogo "  -- Control Desvio Ambiental CDA --"
                               this.onCancelPress("saveDialogIA"); // Cierro el dialogo y vuelvo a cargar información de la App
                    
                             } catch (error) {
                               const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                               MessageToast.show(errorMessage);
                             } finally {
                                Utils.dialogBusy(false);
                                this._loadData( sObraID );
                             }
                           }
                         });

                   } 
               } else {
                    //  ----- > EDITAR Y GUARDAR EL -> 'CDA' -----
                    const sInformeAmbientalID = oModel.getProperty("/DatosFormularioIA/EditSection/selectedRow/ID");
                    const aDocumentacionIA = oModel.getProperty("/DatosFormularioIA/EditSection/documento/DocumentacionAdicional/Documentacion");
                    const invalidField = this._validateFields("documentIA_save");
    
                    if (invalidField) { // Validación de campos obligatorios PSDA
                        let confirmMessage = this.getResourceBundle().getText("editDocumentIa");
                        MessageBox.confirm(confirmMessage, {
                            actions: [MessageBox.Action.CANCEL, "Aceptar"],
                            emphasizedAction: "Aceptar",
                            onClose: async (sAction) => {
                              if (sAction !== "Aceptar")
                                return;
                              try {
                                const oPayload = {   
                                     desempenio_ID: IDdesempenioAmbiental,                             
                                     estado_ID: "BO",
                                     nombre_archivo: aDocumentacionIA[0]?.PSDA_firmada_nombre,
                                     ruta: aDocumentacionIA[0]?.PSDA_firmada_ruta,
                                     observaciones: null                              
                                }
                                
                                const oNewIaDocument = await IA_operations.onUpdateIaDocument(sInformeAmbientalID, oPayload, this.getView());
                                
                                // ----> Cerrar dialogo "  -- Control Desvio Ambiental CDA --"
                                this.onCancelPress("editDialogIA"); // Cierro el dialogo y vuelvo a cargar información de la App
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
               }
            },

            onSaveDA: function( oEvent, sAction ) {
                     // Busy ON
               Utils.dialogBusy(true);

               const oModel = this.getView().getModel("mainModel");
               const sP3Codigo = oModel.getProperty("/HeaderInfo/p3");
               const sRegistroProveedor = oModel.getProperty("/HeaderInfo/supplierRegistration");
               const sObraID = oModel.getProperty("/ObraID");
               const IDdesempenioAmbiental = oModel.getProperty("/ResponsableAmbiental/ID"); //  ---> ID Desempenio Ambiental
              
               const fechaActual = new Date();
               const mesActual = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
               // Lógica para guardar según la acción
               if (sAction === "documentDA_create") { 
                const sDescription = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/descripcion");
                const sComents = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/comentarios"); 
                const aUploadDocumentDA = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/documento/DocumentacionAdicional");
                   
                if (aUploadDocumentDA && Array.isArray(aUploadDocumentDA) && aUploadDocumentDA.length > 0) {
                 aUploadDocumentDA.forEach(doc => {
                        delete doc.fechaAdjunto;
                    });
                }               
                   const invalidField = this._validateFields("documentDA_create");

                   if (invalidField) { // Validación de campos obligatorios PSDA
                       let confirmMessage = this.getResourceBundle().getText("saveDocumentDA");
                       MessageBox.confirm(confirmMessage, {
                           actions: [MessageBox.Action.CANCEL, "Aceptar"],
                           emphasizedAction: "Aceptar",
                           onClose: async (sAction) => {
                             if (sAction !== "Aceptar")
                               return;
                             try {
                               const oPayload = {   
                                    desempenio_ID: IDdesempenioAmbiental,                            
                                    estado_ID: "BO",
                                    descripcion: sDescription || "",
                                    comentarios: sComents || "", 
                                    nombre_archivo: aUploadDocumentDA[0]?.PSDA_firmada_nombre,
                                    ruta: aUploadDocumentDA[0]?.PSDA_firmada_ruta,
                                    observaciones: null                              
                               };
                               
                               const oNewDaDocument = await DA_operations.onCreateDaDocument(oPayload, this.getView());

                                // SE COMENTA PARA TESTING   
                                await DA_operations.createFolderDMS(sObraID, sRegistroProveedor, sP3Codigo);
                                
                                const sFolder = "Documentos Adicionales";
                                    /* -- Post información adjunto al servicio -- */
                                 aUploadDocumentDA.forEach(doc => {
                                    DA_operations.postDMSFile( doc, sObraID , sRegistroProveedor, sP3Codigo, sFolder );
                                });
                               
                               // ----> Cerrar dialogo "  -- Control Desvio Ambiental CDA --"
                               this.onCancelPress("dialogUploadDA"); // Cierro el dialogo y vuelvo a cargar información de la App
                              
                             } catch (error) {
                               const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                               MessageToast.show(errorMessage);
                             } finally {
                               Utils.dialogBusy(false);
                               this._loadData( sObraID );
                             }
                           }
                         });

                   } 
               } else {
                    //  ----- > EDITAR Y GUARDAR EL -> 'DA' -----
                    const sDocumentAdditionalID = oModel.getProperty("/DatosFormularioDA/EditSection/selectedRow/ID");
                    const sDescription = oModel.getProperty("/DatosFormularioDA/EditSection/descripcion");
                    const sComents = oModel.getProperty("/DatosFormularioDA/EditSection/comentarios"); 
                    const aDocumentacionDA = oModel.getProperty("/DatosFormularioDA/EditSection/documento/DocumentacionAdicional/Documentacion");
                    const invalidField = this._validateFields("documentDA_edit");
    
                    if (invalidField) { // Validación de campos obligatorios PSDA
                        let confirmMessage = this.getResourceBundle().getText("editDocumentIa");
                        MessageBox.confirm(confirmMessage, {
                            actions: [MessageBox.Action.CANCEL, "Aceptar"],
                            emphasizedAction: "Aceptar",
                            onClose: async (sAction) => {
                              if (sAction !== "Aceptar"){
                                Utils.dialogBusy(false);
                                return;
                              }
                                
                              try {
                                const oPayload = {   
                                     desempenio_ID: IDdesempenioAmbiental,                             
                                     estado_ID: "BO",
                                     descripcion: sDescription || "",
                                     comentarios: sComents || "",
                                     nombre_archivo: aDocumentacionDA[0]?.PSDA_firmada_nombre,
                                     ruta: aDocumentacionDA[0]?.PSDA_firmada_ruta,
                                     observaciones: null                              
                                }
                                
                                const oNewDaDocument = await DA_operations.onUpdateDaDocument(sDocumentAdditionalID, oPayload, this.getView());
                                
                                // ----> Cerrar dialogo "  -- Control Desvio Ambiental CDA --"
                                this.onCancelPress("editDialogDA"); // Cierro el dialogo y vuelvo a cargar información de la App
                                this._loadData( sObraID );
                              } catch (error) {
                                const errorMessage = this.getResourceBundle().getText("errorCreateADS");
                                MessageToast.show(errorMessage);
                              } finally {
                                Utils.dialogBusy(false);
                              }
                            }
                          });
    
                     } else {
                        Utils.dialogBusy(false);
                     }
               }
            },

            createPdf: async function () {
                const oModel = this.getView().getModel("mainModel");
                let oDatosHeader = oModel.getProperty("/HeaderInfo");
                let oResponsable = oModel.getProperty("/ResponsableAmbiental/responsable_ambiental")
                let oTablePSDA = oModel.getProperty("/DatosFormularioPSDA/TablePSDA/Data");
                let oTableCDA = oModel.getProperty("/DatosFormularioCDA/TableCDA/Data");
                let oTableIA = oModel.getProperty("/DatosFormularioIA/TableIA/Data");
                let oTableDA = oModel.getProperty("/DatosFormularioDA/TableDA/Data");

                
                const oPayload = {
                  "doc_id": "medioambiente",
                  //"fecha": this.formatter.formatDateTable(new Date()),
                  "formato": "base64",
                  "header": oDatosHeader,
                  "responsable": oResponsable,
                  "psda_payload": oTablePSDA,
                  "cda_payload": oTableCDA,
                  "ia_payload": oTableIA,
                  "da_payload": oTableDA,
                };

                const oBinary = await Services.createPdf(oPayload);
                const timeStamp = (new Date()).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[^0-9]/g, '');
                let sFileName = "Medioambiente" + timeStamp;
                const sMimeType = "pdf";
                let aBuffer = this.base64ToArrayBuffer(oBinary.data);
                File.save(aBuffer, sFileName, sMimeType);
              },
          
              base64ToArrayBuffer: function (sBinLine) {
                let binary_string = window.atob(sBinLine);
                let len = binary_string.length;
                let bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binary_string.charCodeAt(i);
                }
                return bytes.buffer;
              },

            //Buscadores
            onSearchPSDA: function (oEvent) {
                const sSearch = oEvent.getParameter("newValue");
                const oTable = this.byId("myTable");
                const oBinding = oTable.getBinding("items");
            
                const aFilter = [
                    new Filter({
                        filters: [
                           this.createStringFilter('numero_planilla', sSearch),
                           this.createStringFilter('fechaUltimoMesInformado', sSearch),
                           this.createStringFilter('control/descripcion', sSearch),
                           this.createStringFilter('estado/descripcion', sSearch),
                           this.createStringFilter('observation', sSearch),
                        ],
                        and: false
                    })
                ];
            
                oBinding.filter(aFilter);
            },

            onSearchCDA: function (oEvent) {
                const sSearch = oEvent.getParameter("newValue");
                const oTable = this.byId("environmentalDeviationControlTable");
                const oBinding = oTable.getBinding("items");
            
                const aFilter = [
                    new Filter({
                        filters: [
                           this.createStringFilter('fechaEntrega', sSearch),
                           this.createStringFilter('fecha_deteccion', sSearch),
                           this.createStringFilter('estado/descripcion', sSearch),
                           this.createStringFilter('observaciones', sSearch),
                        ],
                        and: false
                    })
                ];
            
                oBinding.filter(aFilter);
            },

            onSarchIA: function (oEvent) {
                const sSearch = oEvent.getParameter("newValue");
                const oTable = this.byId("environmentalreportTable");
                const oBinding = oTable.getBinding("items");
            
                const aFilter = [
                    new Filter({
                        filters: [
                           this.createStringFilter('fechaEntrega', sSearch),
                           this.createStringFilter('estado/descripcion', sSearch),
                           this.createStringFilter('observaciones', sSearch),
                        ],
                        and: false
                    })
                ];
            
                oBinding.filter(aFilter);
            },

            onSearchDA: function (oEvent) {
                const sSearch = oEvent.getParameter("newValue");
                const oTable = this.byId("additionalDocumentationTable");
                const oBinding = oTable.getBinding("items");
            
                const aFilter = [
                    new Filter({
                        filters: [
                           this.createStringFilter('descripcion', sSearch),
                           this.createStringFilter('comentarios', sSearch),
                           this.createStringFilter('fecha_Entrega', sSearch),
                           this.createStringFilter('estado/descripcion', sSearch),
                           this.createStringFilter('observaciones', sSearch),
                        ],
                        and: false
                    })
                ];
            
                oBinding.filter(aFilter);
            },

            createStringFilter: function (path, value) {
                return new Filter({
                    path: path,
                    test: function(itemValue) {
                        if (itemValue === null || itemValue === undefined) {
                            itemValue = "";
                        }
                        // Formatea fechaUltimoMesInformado si es el path correspondiente
                        if (path === 'fecha_deteccion' && itemValue) {
                            const [anio, mes, dia] = itemValue.split("-");
                            itemValue = `${dia}/${mes}/${anio}`;
                        }
                        return itemValue.toString().toLowerCase().includes(value.toLowerCase());
                    }
                });
            },   

        });
    });
