import { createReducer, on, combineReducers } from '@ngrx/store';
import * as CounterActions from '../actions/app.actions';
import { initialState, initialAgreeState, initialAgreeState1 } from '../app.state';


export const primitiveReducer = createReducer(
    initialState,
    on(CounterActions.increment, (state) => state + 1),
    on(CounterActions.decrement, (state) => state - 1),
    on(CounterActions.reset, () => initialState)
);

export const objectReducer = createReducer(
    initialAgreeState,
    on(CounterActions.increment, (state) => ({ ...state, model: state.model + "123" })),
    on(CounterActions.decrement, (state) => ({ ...state, model: state.model + "12388" })),
    on(CounterActions.reset, () => initialAgreeState)
);

export const objectReducer1 = createReducer(
    initialAgreeState1,
    on(CounterActions.increment, (state) => ({ ...state, model: state.model + "123" })),
    on(CounterActions.decrement, (state) => ({ ...state, model: state.model + "12388" })),
    on(CounterActions.reset, () => initialAgreeState1)
);

export const combinedReducer = combineReducers({
  
    object: objectReducer,
    object1: objectReducer1
});
