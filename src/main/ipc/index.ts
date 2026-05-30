import { registerAccountHandlers } from './account.handler'
import { registerPublishHandlers } from './publish.handler'
import { registerImageHandlers } from './image.handler'

export function registerAllHandlers(): void {
  registerAccountHandlers()
  registerPublishHandlers()
  registerImageHandlers()
}
