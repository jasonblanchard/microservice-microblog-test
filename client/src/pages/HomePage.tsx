import React from 'react';
import styled from '@emotion/styled'

import UserList from '../apps/UserList';
import Timeline from '../apps/Timeline';
import Post from '../apps/Post';

interface HomePageProps {
  authenticatedUserId: number
}

const Container = styled.div`
  display: flex;
`;

const Sidebar = styled.div`
  width: 200px;
`;

const Main = styled.div`
`;

export default function HomePage({ authenticatedUserId }: HomePageProps) {
  return (
    <Container>
      <Sidebar>
        <UserList authenticatedUserId={authenticatedUserId} />
      </Sidebar>
      <Main>
        <Post authenticatedUserId={authenticatedUserId} />
        <Timeline authenticatedUserId={authenticatedUserId} />
      </Main>
    </Container>
  );
}
