//Author-botamochi
//Description-

function run(context) {

    "use strict";

    if (adsk.debug === true) {
        /*jslint debug: true*/
        debugger;
        /*jslint debug: false*/
    }

    var ui;
    try {
        
        var app = adsk.core.Application.get();
        ui = app.userInterface;
        
        var design = adsk.fusion.Design(app.activeProduct);
        
        var title = 'BOM2CSV';
        if (!design) {
            ui.messageBox('No active design', title);
            adsk.terminate();
            return;
        }
        
        // Get all occurrences in the root component of the active design
        var root = design.rootComponent;
        var occs = root.allOccurrences;
        
        // Gather information about each unique component
        var count = occs.count;
        var i, j, k;
        var bom = [];
        // Search Occurrences for Components
        for (i = 0;i < count;++i) {
            var comp = occs.item(i).component;
            for (j = 0;j < bom.length;++j) {
                if (bom[j].component.equals(comp)) {
                    // Increment the instance count of the existing row.
                    // instances: the number of a named component
                    bom[j].instances += 1;
                    break;
                }
            }
            if (j === bom.length) {
                // Gather any BOM worthy values from the component
                var volume = 0;
                var mat;
                var mass;
                var bodies = comp.bRepBodies;
                
                for (k = 0;k < bodies.count;++k) {
                    var bodyK = bodies.item(k);
                    if (bodyK.isSolid)
                        volume += bodyK.volume;
                        mass = bodyK.physicalProperties.mass;
                        mat = bodyK.material;
                }
                
                if(mass>0 && volume>0){
                    // Add this component to the BOM
                    bom.push({
                        component: comp,
                        name: comp.name,
                        instances: 1,
                        volume: volume,
                        material: mat.name,
                        mass: mass
                    });
                }
            }
        }
        
        // Make CSV
        
        var label = 'Name, Material,Vol. [mm^3], Mass [g], Qty.';
        var csv = bom.reduce(function(previous, current) {
            return previous + '\n' + 
                current.name + ','+
                current.material.replace(/, /g,'-') + ',' + 
                (1000*current.volume).toFixed(2) + ',' + 
                (1000*current.mass).toFixed(2) + ',' +
                current.instances.toString();
        }, label);
        
        var fileDialog = ui.createFileDialog();
        fileDialog.isMultiSelectEnabled = false;
        fileDialog.title = "Specify result filename";
        fileDialog.filter = 'Comma Separated Values (*.csv);;All Files (*.*)';
        fileDialog.filterIndex = 0;
        var dialogResult = fileDialog.showSave();
        var filename;
        if (dialogResult === adsk.core.DialogResults.DialogOK)
        {
            filename = fileDialog.filename;
        }
        else
        {
            adsk.terminate(); 
            return;
        }
        
        adsk.writeFile(filename, csv);    
        ui.messageBox("File written to \"" + filename + "\"");
        
    } 
    catch(e) {
        if (ui) {
            ui.messageBox('Failed : ' + (e.description ? e.description : e));
        }
    }

    adsk.terminate();
}
