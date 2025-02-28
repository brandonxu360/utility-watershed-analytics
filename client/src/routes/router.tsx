import { lazyRouteComponent, createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import Navbar from '../components/navbar/Navbar';
import Home from '../pages/home/Home';

const About = lazyRouteComponent(() => import('../pages/about/About'));
const FAQ = lazyRouteComponent(() => import('../pages/faq/FAQ'));
const Documentation = lazyRouteComponent(() => import('../pages/documentation/Documentation'));
const Login = lazyRouteComponent(() => import('../pages/login/Login'));

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100svh' }}>
        <Navbar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Outlet />
        </div>
      </div>
    </>
  ),
  notFoundComponent: () => <div>Page not found</div>,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
})

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: FAQ,
});

const documentationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documentation',
  component: Documentation,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const watershedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/watershed/$watershedId',
  component: Home,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  faqRoute,
  documentationRoute,
  loginRoute,
  watershedRoute,
]);

// Pass the route tree to the Router constructor
export const router = createRouter({ routeTree });