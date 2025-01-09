sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "sap/ui/core/HTML"
], function (MessageBox, MessageToast, DateFormat, Fragment, HTML) {
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

        onFileUploaderChange: function(oEvent, oView) {
            var oFileUploader = oEvent.getSource();
            var oFile = oFileUploader.oFileUpload.files[0];
            var sFilePath = URL.createObjectURL(oFile);
            var sFileExtension = oFile.name.split('.').pop().toLowerCase();
            
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
                content: "<iframe src='" + sFilePath + "' width='100%' height='600px'></iframe>"
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