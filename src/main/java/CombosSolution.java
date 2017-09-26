package io.yetanotherwhatever;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.stream.Stream;

/**
 * Created by achang on 10/13/2016.
 */
public class CombosSolution {

    public static void main(String args[])
    {
        permsFromFile(args);
    }


    public static void permsFromFile(String args[])
    {

        try (Stream<String> stream = Files.lines(Paths.get(args[0]))) {
            stream.map(s->reorderAlpha(s)).forEach(s -> printPerms(s));

        } catch (IOException ioe)
        {

        }
    }

    public static String reorderAlpha(String in)
    {
        char[] chars = in.toCharArray();
        Arrays.sort(chars);
        String newWord = new String(chars);
        return newWord;
    }

    static int caseCount = 1;
    public static void printPerms(String line)
    {

        line = line.trim();

        System.out.println("Case #" + caseCount++);

        printPerms(new StringBuilder(), new StringBuilder(line));
    }

    public static void printPerms(StringBuilder soFar, StringBuilder remaining)
    {
        if (remaining.length() == 0)
        {
            //we're done, just print soFar
            System.out.println(soFar.toString());
        }

        for (int i = 0; i < remaining.length(); i++)
        {
            StringBuilder next = new StringBuilder(soFar);
            StringBuilder left = new StringBuilder(remaining);
            next.append(left.charAt(i));
            left.deleteCharAt(i);
            printPerms(next, left);
        }
    }
}
