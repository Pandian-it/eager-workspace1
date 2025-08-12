import {ActionReducerMap, createReducer , createAction,Action} from '@ngrx/store';


export interface State {
  model: string;
}

export const initialAgreeState: State = {
  model: "hello world"
};

export interface State1 {
  model: string;
}

export const initialAgreeState1: State1 = {
  model: "hello world"
};
//// primitive type states for testing.. the reducer for this has been commented out.. uncomment and use it 
/// in the app module  StoreModule.forRoot({ counter: primitiveReducer }),
export const initialState:number = 0;

