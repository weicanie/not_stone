import { lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import EditorContainerPage from '../views/Main/ResumeEditor';
import PreloadChunk from './PreloadChunk';
import PrivateRoute from './PrivateRoute';
import UpdateBreadRouter from './UpdateBreadRouter';
const LandingPage = lazy(() => import('../views/Saas/LandingPage'));
const LoginPage = lazy(() => import('../views/LoginRegist/login'));
const RegisterPage = lazy(() => import('../views/LoginRegist/regist'));
const NotFoundPage = lazy(() => import('../views/Saas/NotFound'));
const Main = lazy(() => import('../views/Main'));
const Jobs = lazy(() => import('../views/Main/Jobs'));
const JobRead = lazy(() => import('../views/Main/Jobs/JobRead'));
const Knowledges = lazy(() => import('../views/Main/Knowbase'));
const KnowledgeRead = lazy(() => import('../views/Main/Knowbase/KnowledgeRead'));
const Projects = lazy(() => import('../views/Main/Projects'));
const Resumes = lazy(() => import('../views/Main/Resumes'));
const ResumeActions = lazy(() => import('../views/Main/Resumes/Action'));
const ResumeRead = lazy(() => import('../views/Main/Resumes/ResumeRead'));
const ResumeMatchedRead = lazy(() => import('../views/Main/Jobs/ResumeMatchedRead'));
const MatchedResume = lazy(() => import('../views/Main/Resumes/MatchedResume'));
const Action = lazy(() => import('../views/Main/Projects/Action'));
const Skills = lazy(() => import('../views/Main/Skills'));
const SkillRead = lazy(() => import('../views/Main/Skills/SkillRead'));
const DataCrawl = lazy(() => import('../views/Main/Hjm/DataCrawl'));
const JobMatch = lazy(() => import('../views/Main/Hjm/JobMatch'));
const Anki = lazy(() => import('../views/Main/Anki/Anki'));
const Deepwiki = lazy(() => import('../views/Main/Knowbase/DeepwikiDown'));
const Education = lazy(() => import('../views/Main/Education'));
const EducationRead = lazy(() => import('../views/Main/Education/Read'));
const Career = lazy(() => import('../views/Main/Career'));
const CareerRead = lazy(() => import('../views/Main/Career/Read'));
const UserMemory = lazy(() => import('../views/Main/UserMemory'));
const UserConfig = lazy(() => import('../views/Main/userConfig'));
const AIChat = lazy(() => import('../views/Main/aichat/AIChat'));
const UserManagePage = lazy(() => import('../views/Main/Manage/User'));
const ServiceManagePage = lazy(() => import('../views/Main/Manage/Service'));
const NotificationManagePage = lazy(() => import('../views/Main/Manage/Notifaction'));
const UserNotificationPage = lazy(() => import('../views/Main/Notifaction'));
const isOnline = import.meta.env.VITE_IS_ONLINE === 'true';

const manegeRoute = {
	path: '/main/manage',
	element: (
		<UpdateBreadRouter>
			<PreloadChunk chunkPath={[]}>
				<Outlet />
			</PreloadChunk>
		</UpdateBreadRouter>
	),
	children: [
		{
			path: '',
			element: <Navigate to="/main/manage/user" />
		},
		{
			path: 'user',
			element: (
				<UpdateBreadRouter>
					<UserManagePage />
				</UpdateBreadRouter>
			)
		},
		{
			path: 'service',
			element: (
				<UpdateBreadRouter>
					<ServiceManagePage />
				</UpdateBreadRouter>
			)
		},
		{
			path: 'notification',
			element: (
				<UpdateBreadRouter>
					<NotificationManagePage />
				</UpdateBreadRouter>
			)
		}
	]
};

export const routes = [
	{
		path: '',
		element: <Navigate to="/saas" />
	},
	{
		path: '*',
		element: <NotFoundPage />
	},
	{
		path: '/saas',
		element: <LandingPage />
	},
	{
		path: '/login',
		element: <LoginPage />
	},
	{
		path: '/register',
		element: <RegisterPage />
	},
	{
		path: '/main',
		element: (
			<PrivateRoute>
				<Main />
			</PrivateRoute>
		),
		children: [
			{
				path: '',
				element: <Navigate to="/main/knowledge" />
			},
			// 后台管理
			manegeRoute,
			// 用户配置
			{
				path: '/main/user-config',
				element: (
					<UpdateBreadRouter>
						<UserConfig />
					</UpdateBreadRouter>
				)
			},
			// 通知中心
			{
				path: '/main/notification',
				element: (
					<UpdateBreadRouter>
						<UserNotificationPage />
					</UpdateBreadRouter>
				)
			}
		]
	}
];

/* 用于面包屑导航 */
export const path_name: Record<string, string> = {
	'/main/user-config': '用户配置',

	'/main/notification': '通知中心',

	'/main/manage': '管理后台',
	'/main/manage/user': '用户管理',
	'/main/manage/service': '服务管理',
	'/main/manage/notification': '通知管理'
};

/* 用于侧边栏路由按钮hover时预加载 */
/**
 * 当前URL路径对应的页面的文件路径
 * 注意：动态import需要使用相对路径，@/别名在运行时无法解析
 */
export const sideBar_urlpath_filePath: Record<string, string> = {
};
