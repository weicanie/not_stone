import { configureStore } from '@reduxjs/toolkit';
import { AIChatReducer } from './aichat';
import { breadRouterReducer } from './bread-router';

import { loginReducer } from './login';
import { notificationReducer } from './notification';


const store = configureStore({
	reducer: {
		breadRouter: breadRouterReducer,
		aichat: AIChatReducer,
		login: loginReducer,
		notification: notificationReducer
	}
});

export default store;
