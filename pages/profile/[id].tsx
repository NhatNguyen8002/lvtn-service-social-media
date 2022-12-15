import { AppPageLoading } from "@/components/atoms/AppLoading";
import NavigationBar, {
  homeActiveTabs,
  NavigationBarProps,
  profilePostTabs,
} from "@/components/home/navigation_bar";
import EvaluationPost from "@/components/home/post";
import LeftSide from "@/components/leftSide";
import CustomizedSnackbars from "@/components/mocules/snackbars";
import ProfileSummaryCard from "@/components/profile/profile_summary_card/ProfileSummaryCard";
import RightSide from "@/components/rightSide";
import appPages from "@/shared/appPages";
import * as profilePageAPI from "apis/profile/profilePageAPI";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AuthState } from "redux/slices/auth/authSlice";
import {
  PostListState,
  PostState,
  setPostsList,
  updatePostsInteractionsStatusOfSessionUser,
} from "redux/slices/home/posts/postListSlice";
import postsConverter from "redux/slices/home/posts/postsConverter";
import {
  convertSummaryResponseToState,
  setProfileSummary,
  SummaryState,
} from "redux/slices/profile/summary/summarySlice";
import { RootState, useAppDispatch } from "redux/store/store";
import styles from "./styles.module.css";

export default function Profile({
  summary: initialSummary,
  posts: postsOfUser,
  likedPosts: postsLikedByUser,
}: ProfilePageGetServerSideProps) {
  const dispatch = useAppDispatch();
  const { data: session, status: sessionState } = useSession();

  const { session: authSession }: AuthState = useSelector(
    (state: RootState) => state.auth
  );
  const { posts }: PostListState = useSelector(
    (state: RootState) => state.postList
  );

  const [currentPosts, setCurrentPosts] = useState<PostState[]>(postsOfUser);

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError") {
      signIn(); // Force sign in to hopefully resolve error
    }
  }, [session]);

  useEffect(() => {
    dispatch(setProfileSummary(initialSummary));
  }, [initialSummary]);

  useEffect(() => {
    // re-set posts if it's not shown
    setTimeout(() => {
      if (posts.length == 0) {
        dispatch(setPostsList(currentPosts));
      }
    }, 3000);
  }, []);

  useEffect(() => {
    const sessionUserId = authSession?.user.DBID;
    if (sessionUserId != null) {
      // reset posts list
      dispatch(setPostsList([]));
      dispatch(
        updatePostsInteractionsStatusOfSessionUser({
          userId: sessionUserId,
          posts: currentPosts ?? postsOfUser,
        })
      );
    }
  }, [currentPosts, postsOfUser]);

  const handlePostTabChange = (tab: NavigationBarProps["tabs"][number]) => {
    switch (tab.name) {
      case "POST":
        dispatch(setPostsList(postsOfUser));
        setCurrentPosts(postsOfUser);
        break;
      case "LIKED":
        dispatch(setPostsList(postsLikedByUser));
        setCurrentPosts(postsLikedByUser);
        break;
      default:
        dispatch(setPostsList(postsOfUser));
        break;
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Profile</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <LeftSide currentPage={appPages.profile} />
        <div className={styles.contentContainer}>
          <NavigationBar tabs={homeActiveTabs} type="APP" />
          <ProfileSummaryCard
            summary={initialSummary}
            posts={postsOfUser}
            likedPosts={postsLikedByUser}
          />
          <NavigationBar
            tabs={profilePostTabs}
            type="PROFILE"
            onTabChange={handlePostTabChange}
          />
          <div className={styles.listPost}>
            {posts.length == 0 ? (
              <AppPageLoading />
            ) : (
              posts.map((post: PostState) => (
                <EvaluationPost key={post.id} postState={post} />
              ))
            )}
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

export interface ProfilePageGetServerSideProps {
  summary: SummaryState["summary"];
  posts: PostState[];
  likedPosts: PostState[];
}

export const getServerSideProps: GetServerSideProps<
  ProfilePageGetServerSideProps
> = async (context: GetServerSidePropsContext) => {
  try {
    const userId = context.params.id;

    const summaryReq = fetchUserSummary(userId);
    const postsReq = fetchUserPosts(userId);
    const likedPostsReq = fetchUserLikedPosts(userId);

    const [summary, posts, likedPosts] = await Promise.all([
      summaryReq,
      postsReq,
      likedPostsReq,
    ]);

    return {
      props: {
        summary,
        posts,
        likedPosts,
      },
    };
  } catch (err) {
    console.error(err);
    throw Error("Can not fetch profile info of user " + context.params.id);
  }
};

const fetchUserSummary = async (
  userId: string | string[]
): Promise<ProfilePageGetServerSideProps["summary"]> => {
  const data = await profilePageAPI.getUserSummary({
    user_id: typeof userId == "string" ? parseInt(userId) : parseInt(userId[0]),
    follower_show_limit: 5,
    following_show_limit: 5,
  });
  return convertSummaryResponseToState(data);
};

const fetchUserPosts = async (
  userId: string | string[]
): Promise<PostState[]> => {
  const data = await profilePageAPI.getUserPosts({
    user_id: parseInt(typeof userId == "string" ? userId : userId[0]),
  });
  return postsConverter.convertPostListDtoToPostListState(data);
};

const fetchUserLikedPosts = async (
  userId: string | string[]
): Promise<PostState[]> => {
  const data = await profilePageAPI.getUserLikedPosts({
    user_id: parseInt(typeof userId == "string" ? userId : userId[0]),
  });
  return postsConverter.convertPostListDtoToPostListState(
    data.post_like.map((dto) => dto.liked_posts)
  );
};
