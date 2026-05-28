import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

export class HeatMapControl
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    void context;
  }

  updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    void context;
    return React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0078d4",
          color: "#fff",
          fontFamily: "Segoe UI, Arial, sans-serif",
          fontSize: "18px",
        },
      },
      "PowerMaps HeatMap (virtual diagnostic)"
    );
  }

  getOutputs(): IOutputs {
    return {};
  }

  destroy(): void {
    /* noop */
  }
}
