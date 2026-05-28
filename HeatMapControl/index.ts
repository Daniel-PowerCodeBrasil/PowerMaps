import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class HeatMapControl
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container: HTMLDivElement;

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._container.innerHTML =
      '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0078d4;color:#fff;font-family:Segoe UI,Arial,sans-serif;font-size:18px;">PowerMaps HeatMap (diagnostic)</div>';
  }

  updateView(context: ComponentFramework.Context<IInputs>): void {
    void context;
  }

  getOutputs(): IOutputs {
    return {};
  }

  destroy(): void {
    /* noop */
  }
}
