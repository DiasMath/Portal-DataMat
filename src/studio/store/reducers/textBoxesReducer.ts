import type { StudioState, StudioAction } from '../../types/state';
import type { CanvasTextBox } from '../../types/dashboard';
import { pushUndo } from '../undo-middleware';
import { generateId } from '../../lib/generate-id';
import { getTextBoxMaxZIndex, getTextBoxMinZIndex } from './index';

export function textBoxesReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'ADD_TEXT_BOX': {
      const newTextBox: CanvasTextBox = {
        id: generateId('textbox'),
        x: action.payload.x,
        y: action.payload.y,
        width: 200,
        height: 40,
        zIndex: 1000,
        text: 'Duplo-clique para editar',
        formatting: {
          fontSize: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: '#ffffff',
        },
      };
      return {
        ...pushUndo(state),
        textBoxes: [...state.textBoxes, newTextBox],
        selectedTextBoxId: newTextBox.id,
        isDirty: true,
      };
    }

    case 'REMOVE_TEXT_BOX': {
      return {
        ...pushUndo(state),
        textBoxes: state.textBoxes.filter(tb => tb.id !== action.payload),
        selectedTextBoxId: state.selectedTextBoxId === action.payload ? null : state.selectedTextBoxId,
        isDirty: true,
      };
    }

    case 'UPDATE_TEXT_BOX': {
      return {
        ...pushUndo(state),
        textBoxes: state.textBoxes.map(tb =>
          tb.id === action.payload.id ? { ...tb, ...action.payload.updates } : tb
        ),
        isDirty: true,
      };
    }

    case 'SELECT_TEXT_BOX': {
      return {
        ...state,
        selectedTextBoxId: action.payload,
        selectedVisualId: action.payload ? null : state.selectedVisualId,
      };
    }

    case 'MOVE_TEXT_BOX': {
      return {
        ...pushUndo(state),
        textBoxes: state.textBoxes.map(tb =>
          tb.id === action.payload.id
            ? { ...tb, x: action.payload.x, y: action.payload.y }
            : tb
        ),
        isDirty: true,
      };
    }

    case 'RESIZE_TEXT_BOX': {
      return {
        ...pushUndo(state),
        textBoxes: state.textBoxes.map(tb =>
          tb.id === action.payload.id
            ? { ...tb, width: action.payload.width, height: action.payload.height }
            : tb
        ),
        isDirty: true,
      };
    }

    case 'BRING_TEXT_BOX_TO_FRONT': {
      const maxZ = getTextBoxMaxZIndex(state);
      return {
        ...pushUndo(state),
        textBoxes: state.textBoxes.map(tb =>
          tb.id === action.payload ? { ...tb, zIndex: maxZ + 1 } : tb
        ),
        isDirty: true,
      };
    }

    case 'SEND_TEXT_BOX_TO_BACK': {
      const minZ = getTextBoxMinZIndex(state);
      return {
        ...pushUndo(state),
        textBoxes: state.textBoxes.map(tb =>
          tb.id === action.payload ? { ...tb, zIndex: Math.max(0, minZ - 1) } : tb
        ),
        isDirty: true,
      };
    }

    default:
      return state;
  }
}
