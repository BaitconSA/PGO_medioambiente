sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (MessageBox, BusyIndicator) {
    "use strict";

    return {
        dialogBusy: function (bBusy) {
            if (bBusy) {
                BusyIndicator.show(0);
            } else {
                BusyIndicator.hide();
            }
        },

        
        showMessage: function (sMessage, sTitle, sType) {
            switch (sType) {
                case "ERROR":
                    MessageBox.error(sMessage, { title: sTitle });
                    break;
                case "WARNING":
                    MessageBox.warning(sMessage, { title: sTitle });
                    break;
                case "SUCCESS":
                    MessageBox.success(sMessage, { title: sTitle });
                    break;
                default:
                    MessageBox.information(sMessage, { title: sTitle });
            }
        }
    };
});