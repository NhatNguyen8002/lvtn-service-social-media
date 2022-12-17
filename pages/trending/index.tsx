import NavigationBar, {
  homeActiveTabs,
} from "@/components/home/navigation_bar";
import EvaluationPost from "@/components/home/post";
import RecommendFollowableUsers from "@/components/home/recommendFollowableUsers";
import UserStatusInput from "@/components/home/userStatusInput";
import LeftSide from "@/components/leftSide";
import CustomizedSnackbars from "@/components/mocules/snackbars";
import RightSide from "@/components/rightSide";
import appPages from "@/shared/appPages";
import Head from "next/head";
import Image from "next/image";
import { useSelector } from "react-redux";
import { PostState } from "redux/slices/home/posts/postListSlice";
import { TrendingState } from "redux/slices/trending/trendingSlice";
import { RootState } from "redux/store/store";
import styles from "./styles.module.css";

export default function TrendingPage() {
  const { posts }: TrendingState = useSelector(
    (state: RootState) => state.trendingState
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>Home</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <LeftSide currentPage={appPages.trending} />
        <div className={styles.contentContainer}>
          <NavigationBar tabs={homeActiveTabs} type="APP" />
          <UserStatusInput />
          <RecommendFollowableUsers />
          <div className={styles.listPost}>
            {posts.map((post: PostState) => (
              <EvaluationPost key={post.id} postState={post} />
            ))}
          </div>
        </div>
        <RightSide />
      </main>
      <CustomizedSnackbars />
      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}