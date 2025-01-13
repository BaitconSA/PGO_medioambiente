sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "sap/ui/core/HTML",
    "uimodule/model/formatter"
], function (MessageBox, MessageToast, DateFormat, Fragment, HTML, Formatter) {
    "use strict";

    return {
        onAddManualRow: function ( oView, oController, oModel ) {
           /* let aPsdaData = oModel.getProperty("/managementOptionsIcon/PSDAData");
            aPsdaData.push({
                fechaUltimoMesInformado: "",
                fechaMesAInformar: "",
                control: "",
                estado: ""
            });
            oModel.setProperty("/managementOptionsIcon/PSDAData", aPsdaData); */
    
                if (!oView.byId("dialogUploadPSDA")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.desempenioAmbiental.dialogUploadPSDA.uploadPSDA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("dialogUploadPSDA").open();
                }
  
        },

        // Agrego los valores que se ingresen en el modelo de datos con su correspondiente PATh.
        onInputLiveChange: function ( oEvent, oModel, ID ) {
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");
            let oContext = oInput.getBindingContext("mainModel");
            let sPath = oInput.getBindingPath("value");

            // Actualizar el modelo con el nuevo valor
            oContext.getModel().setProperty(oContext.getPath() + "/" + sPath, sValue);
        },

        onValidateDate: function ( oEvent ) {
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");
            let oDateFormat = DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });

            let bValid = oDateFormat.parse(sValue);

            if (!bValid) {
                oInput.setValueState("Error");
                MessageToast.show("Por favor, ingrese una fecha en el formato dd/mm/aaaa");
            } else {
                oInput.setValueState("None");
            }
        },

        onValidateMonthYear: function (oEvent) {
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");
            let oMonthYearFormat = DateFormat.getDateInstance({
                pattern: "MM/yyyy"
            });

            let bValid = oMonthYearFormat.parse(sValue);

            if (!bValid) {
                oInput.setValueState("Error");
                MessageToast.show("Por favor, ingrese una fecha en el formato mm/aaaa");
            } else {
                oInput.setValueState("None");
            }
        },

        onAddYearRow: function ( oModel ) {
            let aYears = oModel.getProperty("/Years");
        
            let newYear = {
                year: new Date().getFullYear(), // Puedes personalizar esto según tus necesidades
                isYearBlank: true
            };
        
            aYears.push(newYear);
            oModel.setProperty("/Years", aYears);
        },

        onFileUploaderChange: function(oEvent, oView, oModel) {
            var oFileUploader = oEvent.getSource();
            var oFile = oFileUploader.oFileUpload.files[0];
            
            // Verificar si no hay un archivo seleccionado
            if (!oFile) {
                sap.m.MessageToast.show("No se ha seleccionado ningún archivo");
                return;
            }
            
            var sFilePath = URL.createObjectURL(oFile);
            var sFileExtension = oFile.name.split('.').pop().toLowerCase();
        
            // Datos URL documentación
            const sObraID = oModel.getProperty("/ObraData").ID;
            const sP3Codigo = oModel.getProperty("/HeaderInfo/p3");
            const sRegistroProveedor = oModel.getProperty("/HeaderInfo/supplierRegistration");
            const sFolder = "Planilla Seguimiento Ambiental";
        
            const files = oModel.getProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion") || [];
            const sUrl = `/Obras/${sObraID}_${sRegistroProveedor}/${sP3Codigo}/Medio Ambiente/${sFolder}`;
            const file = {
                PSDA_firmada_nombre: oFile.name,
                PSDA_firmada_formato: oFile.type,
                PSDA_firmada_ruta: sUrl,
                fechaAdjunto: new Date()
            };
        
            // Verificar si files es un array, de lo contrario, inicializarlo como array vacío
            const fileList = Array.isArray(files) ? files : [];
        
            // Buscar duplicados en el array de archivos
            const duplicate = fileList.find(doc => doc.PSDA_firmada_nombre === file.PSDA_firmada_nombre);
        
            if (duplicate) {
                const errorMessage = oView.getModel("i18n").getResourceBundle().getText("duplicateDocName");
                MessageBox.error(errorMessage);
                return;
            }
        
            oModel.setProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion", [...fileList, file]);
            oModel.setProperty("/DatosFormularioPSDA/payload/documento/File", oFile);
        
            if (sFileExtension === "pdf") {
                this._showPDFViewer(sFilePath, oView);
            } else if (["jpg", "jpeg", "png", "gif"].indexOf(sFileExtension) !== -1) {
                this._showImageViewer(sFilePath);
            } else {
                // Manejar otros tipos de archivos si es necesario
                sap.m.MessageToast.show("Tipo de archivo no soportado");
            }
        },
        
        
        _showPDFViewer: function(sFilePath, oView) {
            var oHTML = new HTML({
                content: "<iframe src='" + sFilePath + "' width='100%' height='300px'></iframe>"
            });
            oView.byId("previewContainer").removeAllItems();
            oView.byId("previewContainer").addItem(oHTML);
        },
        
        _showImageViewer: function(sFilePath, oView) {
            var oImage = new sap.m.Image({
                src: sFilePath
            });
            oView.byId("previewContainer").removeAllItems();
            oView.byId("previewContainer").addItem(oImage);
            },

        _resetFileUploader: function( oView ) { 
            const oModel = oView.getModel("mainModel");
            oModel.setProperty("/OrderNotesTableData", [] );
            oModel.setProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion", {} );
            oModel.setProperty("/DatosFormularioPSDA/payload/documento/File", {} );
            var oFileUploader = oView.byId("fileUploader"); 
                oFileUploader.clear(); 
                oView.byId("previewContainer").removeAllItems(); 

            },

        onOpenDialogOrderNotes: async function ( oView, oModel, oController ) {
            const oDialog = await this._openDialog("SELECT_ORDER_NOTES", "uimodule.view.desempenioAmbiental.orderNotesRow.OrderNotesDialog", oView, oController);
            },

        _openDialog: async function (fragmentID, fragmentName, oView, oController ) {
            let oDialog = oView.byId(`${oView.getId()}--${fragmentID}`);
            if (!oDialog) {
                oDialog = await Fragment.load({
                id: oView.getId(),
                name: fragmentName,
                controller: oController
                });
                oView.addDependent(oDialog);
            }
            oDialog.open();
            return oDialog;
            },

        onConfirmDialogOrderNotes: async function ( oEvent , oModel ) {
            const oSource = oEvent.getSource();
            const aItems = oSource.getItems();
            const oSelectedItem = [];
            aItems.forEach(rowList => {
              if (rowList.isSelected()) {
                const sPath = rowList.getBindingContext("mainModel")["sPath"];
                oSelectedItem.push(oModel.getProperty(sPath));
              }
            });
            oModel.setProperty("/OrderNotesTableData", oSelectedItem);
        }
    };
});